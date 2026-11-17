import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/connection";
import {
  business,
  businessOnboarding,
  businessVerification,
  businessGbpLocation,
  gbpBusinessConnection,
  gbpConnection,
  gbpOAuthState,
  membership,
  mutationLimit,
  user,
  verificationAudit,
} from "@/db/schema";
import { requireVerifiedAccount, readBusinessDraft } from "../business-drafts";
import type { Principal } from "../authorization";
import { AppError } from "../errors";
import {
  GbpFailure,
  manageScope,
  type GbpConfig,
  type GbpProvider,
  type GbpLocation,
} from "./contracts";
import { requireLive } from "./config";
import { decrypt, digest, encrypt, sameDigest } from "./vault";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type Actor = { principal: Principal; sessionId: string };
type Connection = typeof gbpConnection.$inferSelect;
const days = 24 * 60 * 60 * 1000;
const random = () => randomBytes(32).toString("base64url");
export const bindingCookie = (state: string) =>
  `jado.gbp.${digest(state).slice(0, 20)}`;
export class GbpService {
  constructor(
    private db: Database,
    readonly config: GbpConfig,
    private provider: GbpProvider,
  ) {}
  private async access(actor: Actor, id: string) {
    const draft = await readBusinessDraft(this.db, actor.principal, id);
    const row = await this.db.query.business.findFirst({
      where: eq(business.id, id),
    });
    if (
      !row ||
      row.isFixture ||
      row.archivedAt ||
      row.lifecycleState === "suspended"
    )
      throw new AppError(
        403,
        "BUSINESS_UNAVAILABLE",
        "This business connection is unavailable.",
      );
    return draft;
  }
  private async limit(actor: Actor, key: string, maximum = 30) {
    const [row] = await this.db
      .insert(mutationLimit)
      .values({
        key: `gbp:${key}:${actor.principal.id}`,
        count: 1,
        windowStart: new Date(),
      })
      .onConflictDoUpdate({
        target: mutationLimit.key,
        set: {
          count: sql`case when ${mutationLimit.windowStart}<now()-interval '1 minute' then 1 else ${mutationLimit.count}+1 end`,
          windowStart: sql`case when ${mutationLimit.windowStart}<now()-interval '1 minute' then now() else ${mutationLimit.windowStart} end`,
        },
      })
      .returning();
    if (row.count > maximum)
      throw new AppError(
        429,
        "RATE_LIMITED",
        "Too many Google connection requests. Wait a minute and retry.",
      );
  }
  private audit(
    db: Database | Tx,
    actor: Actor,
    id: string,
    event: string,
    requestId: string,
    reasonCode?: string,
  ) {
    return db.insert(verificationAudit).values({
      id: randomUUID(),
      businessId: id,
      actorId: actor.principal.id,
      event,
      requestId,
      reasonCode,
    });
  }
  async status(actor: Actor, id: string) {
    const draft = await this.access(actor, id);
    const link = await this.db.query.gbpBusinessConnection.findFirst({
      where: and(
        eq(gbpBusinessConnection.businessId, id),
        eq(gbpBusinessConnection.userId, actor.principal.id),
      ),
    });
    const conn = link
      ? await this.db.query.gbpConnection.findFirst({
          where: eq(gbpConnection.id, link.connectionId),
        })
      : null;
    const row = await this.db.query.business.findFirst({
      where: eq(business.id, id),
    });
    return {
      available: this.config.available,
      providerReason: this.config.reason,
      connection: conn?.status || "not_connected",
      state: draft.state,
      reason: draft.reason,
      canonicalLocation: row?.gbpLocationId || null,
      checkedAt: row?.lastVerifiedAt?.toISOString() || null,
      validUntil: row?.proofValidUntil?.toISOString() || null,
    };
  }
  async start(actor: Actor, id: string, requestId: string) {
    await this.access(actor, id);
    await this.limit(actor, "connect", 6);
    if (!this.config.available) {
      await this.audit(
        this.db,
        actor,
        id,
        "gbp.connect_unavailable",
        requestId,
        this.config.reason || "NOT_CONFIGURED",
      );
      return { pending: true, reason: this.config.reason } as const;
    }
    const state = random(),
      cookie = random(),
      verifier = random(),
      nonce = random(),
      stateId = digest(state);
    await this.db.transaction(async (tx) => {
      await requireVerifiedAccount(tx, actor.principal);
      // Expired/consumed one-time secrets have no ongoing purpose.
      await tx
        .delete(gbpOAuthState)
        .where(
          and(
            eq(gbpOAuthState.userId, actor.principal.id),
            sql`${gbpOAuthState.expiresAt}<now()`,
          ),
        );
      await tx.insert(gbpOAuthState).values({
        id: stateId,
        userId: actor.principal.id,
        businessId: id,
        sessionHash: digest(actor.sessionId),
        cookieHash: digest(cookie),
        nonceHash: digest(nonce),
        verifierCipher: encrypt(
          this.config,
          verifier,
          `state:${stateId}:${actor.principal.id}`,
        ),
        expiresAt: new Date(Date.now() + 600000),
      });
      await this.audit(tx, actor, id, "gbp.oauth_started", requestId);
    });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    Object.entries({
      client_id: this.config.clientId,
      redirect_uri: this.config.callback,
      response_type: "code",
      scope: `openid ${manageScope}`,
      access_type: "offline",
      prompt: "consent select_account",
      state,
      nonce,
      code_challenge_method: "S256",
      code_challenge: digest(verifier),
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    return { pending: false, url: url.href, state, cookie } as const;
  }
  async callback(
    actor: Actor,
    state: string,
    cookie: string | undefined,
    code: string | undefined,
    denied: boolean,
    requestId: string,
  ) {
    requireLive(this.config);
    await requireVerifiedAccount(this.db, actor.principal);
    await this.limit(actor, "callback", 12);
    const stateId = digest(state);
    const pending = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(gbpOAuthState)
        .where(eq(gbpOAuthState.id, stateId))
        .for("update");
      if (
        !row ||
        row.consumedAt ||
        row.expiresAt.getTime() < Date.now() ||
        row.userId !== actor.principal.id ||
        !cookie ||
        !sameDigest(row.cookieHash, digest(cookie)) ||
        !sameDigest(row.sessionHash, digest(actor.sessionId))
      )
        throw new AppError(
          400,
          "OAUTH_STATE_INVALID",
          "This Google connection expired or could not be validated. Start again from My Business.",
        );
      await tx
        .update(gbpOAuthState)
        .set({ consumedAt: new Date(), verifierCipher: "" })
        .where(eq(gbpOAuthState.id, stateId));
      await this.audit(
        tx,
        actor,
        row.businessId,
        denied ? "gbp.oauth_cancelled" : "gbp.oauth_callback",
        requestId,
      );
      return row;
    });
    await this.access(actor, pending.businessId);
    if (denied || !code)
      return { businessId: pending.businessId, result: "cancelled" };
    try {
      const grant = await this.provider.exchange(
        code,
        decrypt(
          this.config,
          pending.verifierCipher,
          `state:${stateId}:${actor.principal.id}`,
        ),
        pending.nonceHash,
      );
      if (!grant.scopes.includes(manageScope))
        throw new GbpFailure("PERMISSION_DENIED");
      await this.db.transaction(async (tx) => {
        await tx
          .select()
          .from(user)
          .where(eq(user.id, actor.principal.id))
          .for("update");
        await requireVerifiedAccount(tx, actor.principal);
        const [old] = await tx
          .select()
          .from(gbpConnection)
          .where(
            and(
              eq(gbpConnection.userId, actor.principal.id),
              eq(gbpConnection.subject, grant.subject),
            ),
          )
          .for("update");
        await this.lockAccess(tx, actor, pending.businessId);
        if (old?.status === "revocation_pending")
          throw new AppError(
            409,
            "REVOCATION_PENDING",
            "Finish disconnecting the previous Google connection before reconnecting.",
          );
        const id = old?.id || randomUUID();
        const refreshCipher = grant.refreshToken
          ? encrypt(
              this.config,
              grant.refreshToken,
              `refresh:${id}:${actor.principal.id}`,
            )
          : old?.status === "connected"
            ? old.refreshCipher
            : null;
        if (!refreshCipher) throw new GbpFailure("AUTH_REVOKED");
        const values = {
          accessCipher: encrypt(
            this.config,
            grant.accessToken,
            `access:${id}:${actor.principal.id}`,
          ),
          refreshCipher,
          scopes: grant.scopes,
          expiresAt: grant.expiresAt,
          status: "connected",
          version: (old?.version || 0) + 1,
          updatedAt: new Date(),
        };
        if (old)
          await tx
            .update(gbpConnection)
            .set(values)
            .where(eq(gbpConnection.id, id));
        else
          await tx.insert(gbpConnection).values({
            id,
            userId: actor.principal.id,
            subject: grant.subject,
            ...values,
          });
        await tx
          .insert(gbpBusinessConnection)
          .values({
            businessId: pending.businessId,
            userId: actor.principal.id,
            connectionId: id,
          })
          .onConflictDoUpdate({
            target: [
              gbpBusinessConnection.businessId,
              gbpBusinessConnection.userId,
            ],
            set: { connectionId: id },
          });
        await this.audit(
          tx,
          actor,
          pending.businessId,
          old ? "gbp.oauth_reconnected" : "gbp.oauth_connected",
          requestId,
        );
      });
      return { businessId: pending.businessId, result: "connected" };
    } catch (error) {
      await this.audit(
        this.db,
        actor,
        pending.businessId,
        "gbp.oauth_failed",
        requestId,
        error instanceof GbpFailure ? error.code : "CONNECTION_FAILED",
      );
      throw error;
    }
  }
  private async lockAccess(tx: Tx, actor: Actor, id: string) {
    await requireVerifiedAccount(tx, actor.principal);
    const [row] = await tx
      .select()
      .from(business)
      .where(eq(business.id, id))
      .for("update");
    const [draft] = await tx
      .select()
      .from(businessOnboarding)
      .where(eq(businessOnboarding.businessId, id))
      .for("update");
    const [member] = await tx
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.businessId, id),
          eq(membership.userId, actor.principal.id),
        ),
      )
      .for("update");
    if (
      !row ||
      row.isFixture ||
      row.archivedAt ||
      row.lifecycleState === "suspended" ||
      !draft ||
      (draft.applicantUserId !== actor.principal.id && !member?.active)
    )
      throw new AppError(404, "NOT_FOUND", "Business draft not found.");
    return { row, draft, member };
  }
  private async ownConnection(actor: Actor, id: string) {
    await this.access(actor, id);
    const grant = await this.db.query.gbpBusinessConnection.findFirst({
      where: and(
        eq(gbpBusinessConnection.businessId, id),
        eq(gbpBusinessConnection.userId, actor.principal.id),
      ),
    });
    const conn =
      grant &&
      (await this.db.query.gbpConnection.findFirst({
        where: and(
          eq(gbpConnection.id, grant.connectionId),
          eq(gbpConnection.userId, actor.principal.id),
        ),
      }));
    if (!conn)
      throw new AppError(
        409,
        "GBP_CONNECTION_REQUIRED",
        "Connect your Google Business Profile account first.",
      );
    return conn;
  }
  private async invalidate(
    tx: Tx,
    actor: Actor,
    connectionId: string,
    requestId: string,
    reason: string,
  ) {
    const links = await tx
      .select()
      .from(businessGbpLocation)
      .where(eq(businessGbpLocation.connectionId, connectionId));
    for (const link of links) {
      const [row] = await tx
        .select()
        .from(business)
        .where(eq(business.id, link.businessId))
        .for("update");
      if (!row || row.isFixture) continue;
      const state = [
        "verified_eligible",
        "published",
        "reverification_required",
      ].includes(row.lifecycleState)
        ? "reverification_required"
        : row.lifecycleState;
      await tx
        .update(business)
        .set({
          lifecycleState: state,
          reasonCode: reason,
          proofValidUntil: null,
        })
        .where(eq(business.id, row.id));
      await tx.insert(verificationAudit).values({
        id: randomUUID(),
        businessId: row.id,
        actorId: actor.principal.id,
        event: "business.state_changed",
        fromState: row.lifecycleState,
        toState: state,
        reasonCode: reason,
        requestId,
      });
    }
  }
  private async credentials(actor: Actor, id: string, requestId: string) {
    requireLive(this.config);
    const own = await this.ownConnection(actor, id);
    const result = await this.db.transaction(async (tx) => {
      const [conn] = await tx
        .select()
        .from(gbpConnection)
        .where(eq(gbpConnection.id, own.id))
        .for("update");
      if (conn.status !== "connected" || !conn.refreshCipher)
        throw new GbpFailure("AUTH_REVOKED");
      if (conn.accessCipher && conn.expiresAt.getTime() > Date.now() + 60000)
        return {
          conn,
          token: decrypt(
            this.config,
            conn.accessCipher,
            `access:${conn.id}:${conn.userId}`,
          ),
        };
      try {
        const token = await this.provider.refresh(
          decrypt(
            this.config,
            conn.refreshCipher,
            `refresh:${conn.id}:${conn.userId}`,
          ),
        );
        if (token.scopes.length && !token.scopes.includes(manageScope))
          throw new GbpFailure("AUTH_REVOKED");
        const [updated] = await tx
          .update(gbpConnection)
          .set({
            accessCipher: encrypt(
              this.config,
              token.accessToken,
              `access:${conn.id}:${conn.userId}`,
            ),
            refreshCipher: token.refreshToken
              ? encrypt(
                  this.config,
                  token.refreshToken,
                  `refresh:${conn.id}:${conn.userId}`,
                )
              : conn.refreshCipher,
            expiresAt: token.expiresAt,
            version: conn.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(gbpConnection.id, conn.id))
          .returning();
        await this.audit(tx, actor, id, "gbp.token_refreshed", requestId);
        return { conn: updated, token: token.accessToken };
      } catch (error) {
        if (!(error instanceof GbpFailure) || error.code !== "AUTH_REVOKED")
          throw error;
        await tx
          .update(gbpConnection)
          .set({
            status: "reauthorization_required",
            accessCipher: null,
            version: conn.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(gbpConnection.id, conn.id));
        await this.invalidate(
          tx,
          actor,
          conn.id,
          requestId,
          "GOOGLE_AUTHORIZATION_REVOKED",
        );
        await this.audit(
          tx,
          actor,
          id,
          "gbp.authorization_revoked",
          requestId,
          "GOOGLE_AUTHORIZATION_REVOKED",
        );
        return null; // commit revocation before returning an error
      }
    });
    if (!result) throw new GbpFailure("AUTH_REVOKED");
    return result;
  }
  private async withToken<T>(
    actor: Actor,
    id: string,
    requestId: string,
    call: (token: string) => Promise<T>,
  ): Promise<{ data: T; conn: Connection }> {
    let credentials = await this.credentials(actor, id, requestId);
    try {
      return { data: await call(credentials.token), conn: credentials.conn };
    } catch (error) {
      if (!(error instanceof GbpFailure) || error.code !== "TOKEN_EXPIRED")
        throw error;
      await this.db
        .update(gbpConnection)
        .set({ expiresAt: new Date(0) })
        .where(
          and(
            eq(gbpConnection.id, credentials.conn.id),
            eq(gbpConnection.version, credentials.conn.version),
          ),
        );
      credentials = await this.credentials(actor, id, requestId);
      return { data: await call(credentials.token), conn: credentials.conn };
    }
  }
  async accounts(
    actor: Actor,
    id: string,
    page: string | undefined,
    requestId: string,
  ) {
    await this.limit(actor, "read");
    return (
      await this.withToken(actor, id, requestId, (t) =>
        this.provider.accounts(t, page),
      )
    ).data;
  }
  async locations(
    actor: Actor,
    id: string,
    account: string,
    page: string | undefined,
    requestId: string,
  ) {
    await this.limit(actor, "read");
    return (
      await this.withToken(actor, id, requestId, (t) =>
        this.provider.locations(t, account, page),
      )
    ).data;
  }
  async select(
    actor: Actor,
    id: string,
    account: string,
    location: string,
    page: string | undefined,
    requestId: string,
    recheck = false,
  ) {
    await this.access(actor, id);
    await this.limit(actor, "verify", 10);
    try {
      const { data, conn } = await this.withToken(
        actor,
        id,
        requestId,
        async (token) => {
          // Recheck uses a persisted selection. New selections must belong to a fresh manageable-location page.
          if (
            !recheck &&
            !(await this.provider.locations(token, account, page)).items.some(
              (l) => l.name === location,
            )
          )
            throw new GbpFailure("PERMISSION_DENIED");
          const a = await this.provider.account(token, account),
            l = await this.provider.location(token, location);
          const voice = await this.provider.voice(token, l);
          let role;
          let roleUnavailable = false;
          try {
            role = await this.provider.role(token, a, location);
          } catch (error) {
            if (
              error instanceof GbpFailure &&
              error.code === "PERMISSION_DENIED"
            ) {
              role = { role: "unknown", source: "unresolved" } as const;
              roleUnavailable = true;
            } else throw error;
          }
          return { location: l, voice, role, roleUnavailable };
        },
      );
      return await this.db.transaction(async (tx) => {
        await tx
          .select()
          .from(user)
          .where(eq(user.id, actor.principal.id))
          .for("update");
        // Lock the credential version first: a concurrent disconnect/reconnect invalidates this result.
        const [live] = await tx
          .select()
          .from(gbpConnection)
          .where(eq(gbpConnection.id, conn.id))
          .for("update");
        if (live.status !== "connected" || live.version !== conn.version)
          throw new AppError(
            409,
            "CONNECTION_CHANGED",
            "Google connection changed. Re-check before continuing.",
          );
        const { row, draft, member } = await this.lockAccess(tx, actor, id);
        if (data.roleUnavailable && row.lastVerifiedAt)
          throw new GbpFailure("PERMISSION_DENIED");
        const old = await tx.query.businessGbpLocation.findFirst({
          where: eq(businessGbpLocation.businessId, id),
        });
        if (
          (row.gbpLocationId && row.gbpLocationId !== location) ||
          (old &&
            old.connectionId !== conn.id &&
            (!member?.active || member.role !== "owner"))
        )
          throw new AppError(
            409,
            "CANONICAL_IDENTITY_LOCKED",
            "This business already has a primary Google authority. Ownership changes require a protected review.",
          );
        const owners = await tx
          .select()
          .from(membership)
          .where(
            and(
              eq(membership.businessId, id),
              eq(membership.active, true),
              eq(membership.role, "owner"),
            ),
          );
        let role = data.role.role;
        if (
          role === "owner" &&
          owners.some((m) => m.userId !== actor.principal.id)
        )
          role = "unknown";
        // An independently granted Jado role is not inferred from mere Google management access.
        const approvedMember =
          member?.active &&
          ["owner_invitation", "protected_transfer"].includes(
            member.grantSource || "",
          );
        if (role === "unknown" && approvedMember) role = member!.role;
        const ownerAuthorityLost =
          member?.active &&
          member.role === "owner" &&
          member.grantSource === "gbp_location_account_chain" &&
          data.role.role === "manager";
        const complete = this.complete(data.location, draft.details);
        const reason = ownerAuthorityLost
          ? "OWNER_AUTHORITY_LOST"
          : !data.voice.hasVoiceOfMerchant
            ? data.voice.reason || "GOOGLE_VERIFICATION_REQUIRED"
            : role === "unknown"
              ? "ROLE_AUTHORITY_UNRESOLVED"
              : !complete
                ? "PROFILE_INCOMPLETE"
                : null;
        const state = ownerAuthorityLost
          ? "reverification_required"
          : !data.voice.hasVoiceOfMerchant
            ? row.lastVerifiedAt
              ? "reverification_required"
              : "gbp_unverified"
            : role === "unknown"
              ? "pending_gbp_approval"
              : complete
                ? row.lifecycleState === "published"
                  ? "published"
                  : "verified_eligible"
                : "draft";
        const checkedAt = new Date(),
          validUntil = !reason ? new Date(Date.now() + days) : null;
        await tx
          .update(business)
          .set({
            gbpLocationId: location,
            googlePlaceId: data.location.placeId || row.googlePlaceId,
            lifecycleState: state,
            reasonCode: reason,
            lastVerifiedAt: !reason ? checkedAt : row.lastVerifiedAt,
            proofValidUntil: validUntil,
          })
          .where(eq(business.id, id));
        await tx
          .insert(businessGbpLocation)
          .values({
            businessId: id,
            connectionId: conn.id,
            accountName: account,
            locationName: location,
            role,
            roleSource: data.role.source,
            checkedAt,
          })
          .onConflictDoUpdate({
            target: businessGbpLocation.businessId,
            set: {
              connectionId: conn.id,
              accountName: account,
              locationName: location,
              role,
              roleSource: data.role.source,
              checkedAt,
            },
          });
        if (
          role !== "unknown" &&
          data.voice.hasVoiceOfMerchant &&
          !ownerAuthorityLost
        ) {
          await tx
            .insert(membership)
            .values({
              businessId: id,
              userId: actor.principal.id,
              role,
              active: true,
              grantSource: "gbp_location_account_chain",
            })
            .onConflictDoUpdate({
              target: [membership.userId, membership.businessId],
              set: {
                role,
                active: true,
                grantSource: approvedMember
                  ? member!.grantSource
                  : "gbp_location_account_chain",
                revokedAt: null,
              },
            });
        }
        await tx.insert(businessVerification).values({
          id: randomUUID(),
          businessId: id,
          connectionId: conn.id,
          locationName: location,
          outcome: state,
          reasonCode: reason || "VERIFIED_REQUIREMENTS_MET",
          checkedAt,
          validUntil,
          voiceOfMerchant: data.voice.hasVoiceOfMerchant,
          roleEvidence: `${data.role.source}:${data.role.role}`,
        });
        await this.audit(tx, actor, id, "gbp.location_selected", requestId);
        await this.audit(
          tx,
          actor,
          id,
          "gbp.voice_checked",
          requestId,
          data.voice.hasVoiceOfMerchant
            ? "VOICE_OF_MERCHANT_CONFIRMED"
            : data.voice.reason || "VOICE_OF_MERCHANT_ABSENT",
        );
        await tx.insert(verificationAudit).values({
          id: randomUUID(),
          businessId: id,
          actorId: actor.principal.id,
          event: "business.state_changed",
          fromState: row.lifecycleState,
          toState: state,
          reasonCode: reason,
          requestId,
        });
        return { state, reason };
      });
    } catch (error) {
      const cause = error as { code?: string; cause?: { code?: string } };
      if (cause.code === "23505" || cause.cause?.code === "23505") {
        await this.audit(
          this.db,
          actor,
          id,
          "gbp.claim_conflict",
          requestId,
          "DUPLICATE_CLAIM",
        );
        throw new AppError(
          409,
          "DUPLICATE_CLAIM",
          "This Google business is already connected to another Jado business. A protected ownership review is required; no ownership was transferred.",
        );
      }
      if (error instanceof GbpFailure) {
        await this.audit(
          this.db,
          actor,
          id,
          "gbp.check_failed",
          requestId,
          error.code,
        );
        // Generic 403/404, outages and quota errors are not proof of revoked ownership.
      }
      throw error;
    }
  }
  private complete(
    location: GbpLocation,
    details: { description: string; serviceArea: string; contactEmail: string },
  ) {
    const phoneDigits = location.phone?.replace(/\D/g, "") || "";
    let website = false;
    try {
      const url = new URL(location.website || "");
      website =
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password;
    } catch {}
    const validContact =
      (phoneDigits.length >= 7 && phoneDigits.length <= 15) ||
      website ||
      !!details.contactEmail;
    return !!(
      location.title.trim() &&
      location.category?.trim() &&
      (location.address?.trim() ||
        location.serviceArea ||
        details.serviceArea.trim()) &&
      details.description.trim() &&
      validContact
    );
  }

  async recheck(actor: Actor, id: string, requestId: string) {
    await this.access(actor, id);
    const selection = await this.db.query.businessGbpLocation.findFirst({
      where: eq(businessGbpLocation.businessId, id),
    });
    if (!selection)
      throw new AppError(
        409,
        "LOCATION_REQUIRED",
        "Select a Google business location first.",
      );
    return this.select(
      actor,
      id,
      selection.accountName,
      selection.locationName,
      undefined,
      requestId,
      true,
    );
  }
  async disconnect(actor: Actor, id: string, requestId: string) {
    await this.access(actor, id);
    await this.limit(actor, "disconnect", 6);
    const own = await this.ownConnection(actor, id);
    const conn = await this.db.transaction(async (tx) => {
      await tx
        .select()
        .from(user)
        .where(eq(user.id, actor.principal.id))
        .for("update");
      const [c] = await tx
        .select()
        .from(gbpConnection)
        .where(eq(gbpConnection.id, own.id))
        .for("update");
      const links = await tx
        .select()
        .from(businessGbpLocation)
        .where(eq(businessGbpLocation.connectionId, c.id));
      for (const link of links) {
        const { member } = await this.lockAccess(tx, actor, link.businessId);
        if (!member?.active || member.role !== "owner")
          throw new AppError(
            403,
            "OWNER_AUTHORITY_REQUIRED",
            "Only an authorized OWNER can disconnect a primary Google authority. This connection may authorize several businesses.",
          );
      }
      if (c.status === "revoked") return c;
      await tx
        .update(gbpConnection)
        .set({
          status: "revocation_pending",
          accessCipher: null,
          version: c.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(gbpConnection.id, c.id));
      await this.invalidate(tx, actor, c.id, requestId, "GBP_DISCONNECTED");
      await this.audit(tx, actor, id, "gbp.revoke_requested", requestId);
      return { ...c, status: "revocation_pending" };
    });
    if (conn.status === "revoked") return { connection: "revoked" };
    try {
      if (conn.refreshCipher)
        await this.provider.revoke(
          decrypt(
            this.config,
            conn.refreshCipher,
            `refresh:${conn.id}:${conn.userId}`,
          ),
        );
      await this.db.transaction(async (tx) => {
        await tx
          .update(gbpConnection)
          .set({
            status: "revoked",
            accessCipher: null,
            refreshCipher: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(gbpConnection.id, conn.id),
              eq(gbpConnection.status, "revocation_pending"),
            ),
          );
        await this.audit(tx, actor, id, "gbp.oauth_revoked", requestId);
      });
      return { connection: "revoked" };
    } catch (error) {
      const latest = await this.db.query.gbpConnection.findFirst({
        where: eq(gbpConnection.id, conn.id),
      });
      if (latest?.status === "revoked") return { connection: "revoked" };
      await this.audit(
        this.db,
        actor,
        id,
        "gbp.revoke_retry_required",
        requestId,
        error instanceof GbpFailure ? error.code : "TEMPORARY_FAILURE",
      );
      return { connection: "revocation_pending" };
    }
  }
}
