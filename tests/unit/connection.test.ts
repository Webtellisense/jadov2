import { createServer } from "node:net";
import { once } from "node:events";
import { expect, it } from "vitest";
import { connectDatabase } from "@/db/connection";

it("allows a slow connection more than five seconds without waiting indefinitely", async () => {
  const server = createServer((socket) => {
    setTimeout(() => socket.destroy(), 6000);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No port");
  const { pool } = connectDatabase(`postgresql://test@127.0.0.1:${address.port}/test`);
  const start = Date.now();
  try {
    await expect(pool.query("select 1")).rejects.not.toThrow("timeout");
    expect(Date.now() - start).toBeGreaterThanOrEqual(5500);
    expect(pool.options.connectionTimeoutMillis).toBe(15000);
  } finally {
    await pool.end();
    server.close();
  }
}, 10000);
