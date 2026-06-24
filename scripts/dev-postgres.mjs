import { spawn, execSync } from "node:child_process";

const children = [];

const postgresEnv = {
  UGC_DATABASE_URL: process.env.UGC_DATABASE_URL ?? "jdbc:postgresql://localhost:5432/ugc_level_platform",
  UGC_DATABASE_USERNAME: process.env.UGC_DATABASE_USERNAME ?? "postgres",
  UGC_DATABASE_PASSWORD: process.env.UGC_DATABASE_PASSWORD ?? "postgres",
  UGC_DATABASE_DRIVER: process.env.UGC_DATABASE_DRIVER ?? "org.postgresql.Driver",
  UGC_DATABASE_SCHEMA: process.env.UGC_DATABASE_SCHEMA ?? "public",
};

const startProcess = (name, command, args, extraEnv = {}) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
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

const waitForPostgres = async () => {
  const maxAttempts = 30;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      execSync("docker compose exec -T postgres pg_isready -U postgres -d ugc_level_platform", {
        stdio: "ignore",
      });
      console.log("[postgres] ready");
      return;
    } catch {
      console.log(`[postgres] waiting (${attempt}/${maxAttempts})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error("PostgreSQL did not become ready in time");
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[postgres] starting docker compose service...");
execSync("docker compose up -d postgres", { stdio: "inherit" });

await waitForPostgres();

console.log("[backend] starting with PostgreSQL");
startProcess("backend", "sbt", ["run"], postgresEnv);
startProcess("frontend", "node_modules/vite/bin/vite.js", []);
