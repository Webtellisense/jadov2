import { randomUUID } from "node:crypto";
import { AppError } from "./errors";

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function route(
  handler: (request: Request, requestId: string) => Promise<Response>,
) {
  return async (request: Request) => {
    const requestId = randomUUID();
    try {
      const response = await handler(request, requestId);
      response.headers.set("X-Request-Id", requestId);
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (error) {
      const known = error instanceof AppError;
      if (!known)
        console.error(JSON.stringify({ event: "request_failed", requestId }));
      return Response.json(
        {
          error: known ? error.code : "UNAVAILABLE",
          message: known
            ? error.message
            : "Something is unavailable. Please try again.",
          requestId,
        },
        {
          status: known ? error.status : 503,
          headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
        },
      );
    }
  };
}
export function assertSameOrigin(request: Request, origin: string) {
  if (request.headers.get("origin") !== origin)
    throw new AppError(
      403,
      "INVALID_ORIGIN",
      "Please submit this request from Jado.",
    );
}
export async function readJson(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new AppError(415, "JSON_REQUIRED", "A JSON request is required.");
  }
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError(400, "INVALID_INPUT", "A request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4096) {
      await reader.cancel();
      throw new AppError(413, "BODY_TOO_LARGE", "The request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new AppError(400, "INVALID_INPUT", "The request body is invalid.");
  }
}
