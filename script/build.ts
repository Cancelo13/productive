import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { copyFile, mkdir, rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
const allowlist = [
  "drizzle-orm",
  "drizzle-zod",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  
  console.log("building React renderer...");
  await viteBuild();

  await mkdir("dist/public", { recursive: true });
  await copyFile("public/icon.ico", "dist/public/icon.ico");

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    external: ["sqlite3", "better-sqlite3", "pg", "express", ...externals],
    logLevel: "info",
  });

  console.log("building electron main process...");
  await esbuild({
    entryPoints: ["electron/main.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/electron/main.cjs",
    external: ["electron", "drizzle-orm", ...externals],
    logLevel: "info",
  });

  console.log("building electron preload script...");
  await esbuild({
    entryPoints: ["electron/preload.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/electron/preload.cjs",
    external: ["electron"],
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
