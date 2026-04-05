import { spawn } from "node:child_process";

const children = [];

const startProcess = (name, command, args) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${name}] exited with signal ${signal}`);
    } else if (code !== 0) {
      console.log(`[${name}] exited with code ${code}`);
    }

    shutdown(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start`, error);
    shutdown(1);
  });

  children.push(child);
};

let shuttingDown = false;

const shutdown = (exitCode) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  process.exit(exitCode);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

startProcess("backend", "node", ["--import", "tsx", "src/backend/server.ts"]);
startProcess("frontend", "node_modules/vite/bin/vite.js", []);
