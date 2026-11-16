import type { ChildProcess } from "node:child_process";

/** Stop only the child we spawned; handle an exit that happened before cleanup. */
export async function stopChild(child: ChildProcess, graceMs = 5000) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null)
    return;
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(forceTimer);
      clearTimeout(deadline);
      child.off("exit", onExit);
      child.off("error", onError);
    };
    const onExit = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    child.once("exit", onExit);
    child.once("error", onError);
    // Referenced timers bound the wait and keep top-level await alive until settled.
    const forceTimer = setTimeout(() => child.kill("SIGKILL"), graceMs);
    const deadline = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "Verification server did not terminate within the shutdown deadline.",
        ),
      );
    }, graceMs + 5000);
    child.kill("SIGTERM");
  });
}
