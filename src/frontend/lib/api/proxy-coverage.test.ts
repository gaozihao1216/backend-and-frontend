import { strict as assert } from "node:assert";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(apiDir, "../../../..");
const viteConfigPath = path.join(projectRoot, "vite.config.ts");

const extractProxyPrefixes = async (): Promise<string[]> => {
  const configSource = await readFile(viteConfigPath, "utf8");
  const proxyBlock = /proxy:\s*{(?<body>[\s\S]*?)\n\s*},/.exec(configSource)?.groups?.body;
  assert.ok(proxyBlock, "vite.config.ts should define server.proxy");

  return [...proxyBlock.matchAll(/["'`]([^"'`]+)["'`]\s*:/g)]
    .map((match) => match[1])
    .filter((prefix): prefix is string => Boolean(prefix?.startsWith("/")));
};

const normalizeRequestPath = (rawPath: string): string | null => {
  if (!rawPath.startsWith("/")) {
    return null;
  }

  const beforeExpression = rawPath.split("${", 1)[0] ?? rawPath;
  const beforeQuery = beforeExpression.split("?", 1)[0] ?? beforeExpression;
  return beforeQuery.replace(/\/$/, "") || "/";
};

const extractRequestPaths = async (): Promise<string[]> => {
  const files = await readdir(apiDir);
  const apiFiles = files.filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
  const paths = new Set<string>();

  for (const file of apiFiles) {
    const source = await readFile(path.join(apiDir, file), "utf8");
    const requestCalls = source.matchAll(/request\s*\(\s*([`"'])([\s\S]*?)\1\s*,/g);

    for (const match of requestCalls) {
      const requestPath = normalizeRequestPath(match[2] ?? "");
      if (requestPath) {
        paths.add(requestPath);
      }
    }
  }

  return [...paths].sort();
};

const isCoveredByProxy = (apiPath: string, proxyPrefix: string) =>
  apiPath === proxyPrefix || apiPath.startsWith(`${proxyPrefix}/`);

test("frontend API request paths are covered by the Vite dev proxy", async () => {
  const [proxyPrefixes, apiPaths] = await Promise.all([
    extractProxyPrefixes(),
    extractRequestPaths(),
  ]);

  assert.ok(apiPaths.length > 0, "expected to discover frontend API request paths");
  assert.ok(apiPaths.includes("/auth/bind"), "expected auth bind API path to be covered by this test");

  const uncoveredPaths = apiPaths.filter((apiPath) =>
    !proxyPrefixes.some((proxyPrefix) => isCoveredByProxy(apiPath, proxyPrefix)),
  );

  assert.deepEqual(
    uncoveredPaths,
    [],
    `Missing Vite proxy coverage for API paths: ${uncoveredPaths.join(", ")}`,
  );
});
