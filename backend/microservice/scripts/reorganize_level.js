#!/usr/bin/env node
/**
 * Reorganize level/ api, objects, and support into domain subpackages.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "src", "level");
const scanRoots = [
  path.resolve(__dirname, "..", "src"),
  path.resolve(__dirname, "..", "test"),
];

const moves = [
  ["api/CreateLevelApi.scala", "api/design/CreateLevelApi.scala"],
  ["api/CreateLevelBody.scala", "api/design/CreateLevelBody.scala"],
  ["api/SubmitLevelApi.scala", "api/design/SubmitLevelApi.scala"],
  ["api/SubmitLevelBody.scala", "api/design/SubmitLevelBody.scala"],
  ["api/GetPublishedLevelsApi.scala", "api/player/read/GetPublishedLevelsApi.scala"],
  ["api/GetPublishedLevelApi.scala", "api/player/read/GetPublishedLevelApi.scala"],
  ["api/GetLevelCommentsApi.scala", "api/player/read/GetLevelCommentsApi.scala"],
  ["api/GetFavoriteLevelsApi.scala", "api/player/read/GetFavoriteLevelsApi.scala"],
  ["api/RateLevelApi.scala", "api/player/action/RateLevelApi.scala"],
  ["api/RateLevelBody.scala", "api/player/action/RateLevelBody.scala"],
  ["api/FavoriteLevelApi.scala", "api/player/action/FavoriteLevelApi.scala"],
  ["api/UnfavoriteLevelApi.scala", "api/player/action/UnfavoriteLevelApi.scala"],
  ["api/CreateCommentApi.scala", "api/player/action/CreateCommentApi.scala"],
  ["api/CreateCommentBody.scala", "api/player/action/CreateCommentBody.scala"],
  ["objects/Level.scala", "objects/level/Level.scala"],
  ["objects/LevelData.scala", "objects/level/LevelData.scala"],
  ["objects/GameWorld.scala", "objects/level/GameWorld.scala"],
  ["objects/Position.scala", "objects/terrain/Position.scala"],
  ["objects/Size.scala", "objects/terrain/Size.scala"],
  ["objects/LevelGround.scala", "objects/terrain/LevelGround.scala"],
  ["objects/GroundLine.scala", "objects/terrain/GroundLine.scala"],
  ["objects/GroundBezier.scala", "objects/terrain/GroundBezier.scala"],
  ["objects/LevelTerrain.scala", "objects/terrain/LevelTerrain.scala"],
  ["objects/TerrainVoidSpan.scala", "objects/terrain/TerrainVoidSpan.scala"],
  ["objects/LevelObstacle.scala", "objects/terrain/LevelObstacle.scala"],
  ["objects/LevelEnemy.scala", "objects/terrain/LevelEnemy.scala"],
  ["objects/Submission.scala", "objects/submission/Submission.scala"],
  ["objects/SubmissionWithLevel.scala", "objects/submission/SubmissionWithLevel.scala"],
  ["objects/Rating.scala", "objects/social/Rating.scala"],
  ["objects/RateLevelErrors.scala", "objects/social/RateLevelErrors.scala"],
  ["objects/LevelComment.scala", "objects/social/LevelComment.scala"],
  ["objects/Favorite.scala", "objects/social/Favorite.scala"],
  ["objects/FavoriteWithLevel.scala", "objects/social/FavoriteWithLevel.scala"],
  ["objects/BirdPool.scala", "objects/inventory/BirdPool.scala"],
  ["objects/BirdInventory.scala", "objects/inventory/BirdInventory.scala"],
  ["objects/CreateLevelErrors.scala", "objects/errors/CreateLevelErrors.scala"],
  ["utils/LevelApiSupport.scala", "support/player/LevelApiSupport.scala"],
];

const objectPackages = {
  Level: "microservice.level.objects.level",
  LevelData: "microservice.level.objects.level",
  GameWorld: "microservice.level.objects.level",
  Position: "microservice.level.objects.terrain",
  Size: "microservice.level.objects.terrain",
  LevelGround: "microservice.level.objects.terrain",
  GroundLine: "microservice.level.objects.terrain",
  GroundBezier: "microservice.level.objects.terrain",
  LevelTerrain: "microservice.level.objects.terrain",
  TerrainVoidSpan: "microservice.level.objects.terrain",
  LevelObstacle: "microservice.level.objects.terrain",
  LevelEnemy: "microservice.level.objects.terrain",
  Submission: "microservice.level.objects.submission",
  SubmissionWithLevel: "microservice.level.objects.submission",
  Rating: "microservice.level.objects.social",
  RateLevelErrors: "microservice.level.objects.social",
  LevelComment: "microservice.level.objects.social",
  Favorite: "microservice.level.objects.social",
  FavoriteWithLevel: "microservice.level.objects.social",
  BirdPool: "microservice.level.objects.inventory",
  BirdInventory: "microservice.level.objects.inventory",
  CreateLevelErrors: "microservice.level.objects.errors",
};

const apiPackages = {
  CreateLevelAPIMessage: "microservice.level.api.design",
  CreateLevelBody: "microservice.level.api.design",
  SubmitLevelAPIMessage: "microservice.level.api.design",
  SubmitLevelBody: "microservice.level.api.design",
  GetPublishedLevelsAPIMessage: "microservice.level.api.player.read",
  GetPublishedLevelAPIMessage: "microservice.level.api.player.read",
  GetLevelCommentsAPIMessage: "microservice.level.api.player.read",
  GetFavoriteLevelsAPIMessage: "microservice.level.api.player.read",
  RateLevelAPIMessage: "microservice.level.api.player.action",
  RateLevelBody: "microservice.level.api.player.action",
  FavoriteLevelAPIMessage: "microservice.level.api.player.action",
  UnfavoriteLevelAPIMessage: "microservice.level.api.player.action",
  CreateCommentAPIMessage: "microservice.level.api.player.action",
  CreateCommentBody: "microservice.level.api.player.action",
};

function packageForRelative(relativePath) {
  const dir = path.dirname(relativePath);
  return `microservice.level.${dir.replace(/\//g, ".")}`;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".scala")) out.push(full);
  }
  return out;
}

function moveFiles() {
  for (const [from, to] of moves) {
    const src = path.join(root, from);
    const dest = path.join(root, to);
    if (!fs.existsSync(src)) {
      console.warn(`skip missing: ${from}`);
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    let content = fs.readFileSync(dest, "utf8");
    const pkg = packageForRelative(to);
    content = content.replace(/^package\s+[^\n]+/m, `package ${pkg}`);
    fs.writeFileSync(dest, content);
    console.log(`moved ${from} -> ${to}`);
  }
  const utilsDir = path.join(root, "utils");
  if (fs.existsSync(utilsDir) && fs.readdirSync(utilsDir).every((f) => f === ".gitkeep")) {
    // keep .gitkeep or remove empty utils
  }
}

function replaceObjectImport(content) {
  content = content.replace(
    /import microservice\.level\.utils\.LevelApiSupport/g,
    "import microservice.level.support.player.LevelApiSupport"
  );

  content = content.replace(
    /import microservice\.level\.objects\._\s*\n/g,
    [
      "import microservice.level.objects.level._",
      "import microservice.level.objects.terrain._",
      "import microservice.level.objects.inventory._",
      "",
    ].join("\n")
  );

  content = content.replace(
    /import microservice\.level\.api\._\s*\n/g,
    (match, offset, full) => {
      if (full.includes("PlayerLevelReadRouter") || full.includes("object PlayerLevelReadRouter")) {
        return "import microservice.level.api.player.read._\n";
      }
      if (full.includes("PlayerLevelActionRouter") || full.includes("object PlayerLevelActionRouter")) {
        return [
          "import microservice.level.api.player.action._",
          "",
        ].join("\n");
      }
      return match;
    }
  );

  content = content.replace(
    /import microservice\.level\.api\.(\{[^}]+\}|([A-Za-z0-9_]+))/g,
    (full, blockOrName) => {
      if (blockOrName.startsWith("{")) {
        const names = blockOrName
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const groups = new Map();
        for (const name of names) {
          const pkg = apiPackages[name];
          if (!pkg) throw new Error(`unknown api symbol in block: ${name}`);
          if (!groups.has(pkg)) groups.set(pkg, []);
          groups.get(pkg).push(name);
        }
        return [...groups.entries()]
          .map(([pkg, syms]) => `import ${pkg}.{${syms.join(", ")}}`)
          .join("\nimport ");
      }
      const pkg = apiPackages[blockOrName];
      if (!pkg) return full;
      return `import ${pkg}.${blockOrName}`;
    }
  );

  content = content.replace(
    /import microservice\.level\.objects\.(\{[^}]+\}|([A-Za-z0-9_]+))/g,
    (full, blockOrName) => {
      if (blockOrName.startsWith("{")) {
        const names = blockOrName
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const groups = new Map();
        for (const name of names) {
          const pkg = objectPackages[name];
          if (!pkg) throw new Error(`unknown object symbol in block: ${name}`);
          if (!groups.has(pkg)) groups.set(pkg, []);
          groups.get(pkg).push(name);
        }
        return [...groups.entries()]
          .map(([pkg, syms]) => `import ${pkg}.{${syms.join(", ")}}`)
          .join("\nimport ");
      }
      const pkg = objectPackages[blockOrName];
      if (!pkg) return full;
      return `import ${pkg}.${blockOrName}`;
    }
  );

  return content;
}

function addCrossPackageImports(filePath, content) {
  const rel = path.relative(root, filePath).replace(/\\/g, "/");

  if (rel === "objects/level/LevelData.scala") {
    if (!content.includes("objects.terrain")) {
      content = content.replace(
        /import io\.circe\.generic\.semiauto\._\n/,
        `import io.circe.generic.semiauto._\nimport microservice.level.objects.inventory.{BirdInventory, BirdPool}\nimport microservice.level.objects.terrain._\n`
      );
    }
  }

  if (rel === "objects/submission/SubmissionWithLevel.scala") {
    content = content.replace(
      /import microservice\.system\.objects\.SubmissionStatus\n/,
      `import microservice.level.objects.level.Level\nimport microservice.system.objects.SubmissionStatus\n`
    );
  }

  if (rel === "objects/social/FavoriteWithLevel.scala") {
    content = content.replace(
      /import io\.circe\.generic\.semiauto\._\n/,
      `import io.circe.generic.semiauto._\nimport microservice.level.objects.level.Level\n`
    );
  }

  return content;
}

function updateImports() {
  for (const scanRoot of scanRoots) {
    for (const file of walk(scanRoot)) {
      const before = fs.readFileSync(file, "utf8");
      let after = replaceObjectImport(before);
      after = addCrossPackageImports(file, after);
      if (after !== before) {
        fs.writeFileSync(file, after);
        console.log(`updated imports: ${path.relative(scanRoot, file)}`);
      }
    }
  }
}

moveFiles();
updateImports();
console.log("done");
