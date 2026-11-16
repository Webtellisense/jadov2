import { spawn } from "node:child_process";
import { once } from "node:events";
import { expect, it } from "vitest";
import { stopChild } from "../../scripts/stop-child";

it("returns immediately for an already exited child (the reported regression)", async () => {
  const child = spawn(process.execPath, ["-e", ""]);
  await once(child, "exit");
  await stopChild(child);
  expect(child.exitCode).toBe(0);
});
it("terminates a running child and can safely be called again", async () => {
  const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"]);
  await once(child, "spawn");
  await stopChild(child);
  await stopChild(child);
  expect(child.signalCode).toBe("SIGTERM");
});
it("bounds shutdown when the child ignores SIGTERM", async () => {
  const child = spawn(
    process.execPath,
    [
      "-e",
      "process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000)",
    ],
    { stdio: ["ignore", "pipe", "ignore"] },
  );
  await once(child.stdout!, "data");
  await stopChild(child, 50);
  expect(child.signalCode).toBe("SIGKILL");
});
it("does not wait for an exit event from a failed spawn", async () => {
  const child = spawn("/nonexistent-jado-test-binary");
  await once(child, "error");
  await stopChild(child);
  expect(child.pid).toBeUndefined();
});
