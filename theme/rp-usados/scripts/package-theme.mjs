import archiver from "archiver";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const themeRoot = resolve(scriptDirectory, "..");
const outputDirectory = resolve(themeRoot, "..", "..", "dist");
const outputPath = resolve(outputDirectory, "rp-usados.zip");

const excludedRoots = new Set([
  "node_modules",
  "src",
  "scripts",
]);

const excludedFiles = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "vite.config.js",
]);

mkdirSync(outputDirectory, { recursive: true });

const output = createWriteStream(outputPath);
const archive = archiver("zip", { zlib: { level: 9 } });

const completed = new Promise((resolvePromise, rejectPromise) => {
  output.on("close", resolvePromise);
  output.on("error", rejectPromise);
  archive.on("error", rejectPromise);
  archive.on("warning", (error) => {
    if (error.code === "ENOENT") {
      console.warn(error.message);
      return;
    }

    rejectPromise(error);
  });
});

archive.pipe(output);
archive.directory(themeRoot, "rp-usados", (entry) => {
  const localPath = entry.name.replaceAll("\\", "/");
  const [root] = localPath.split("/");

  if (excludedRoots.has(root) || excludedFiles.has(localPath) || localPath.startsWith("assets/hero/v6-1") || localPath === "template-parts/home/hero-webgl.php" || localPath === "template-parts/home/featured.php") {
    return false;
  }

  if (localPath.endsWith("/.gitkeep") || localPath === ".gitkeep") {
    return false;
  }

  return entry;
});

await archive.finalize();
await completed;

console.log(`Tema empaquetado: ${outputPath} (${archive.pointer()} bytes)`);
