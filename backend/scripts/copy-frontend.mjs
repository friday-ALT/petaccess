import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = path.join(root, "index-v2.html");
const destDir = path.join(root, "backend", "public");
const dest = path.join(destDir, "index-v2.html");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("Copied index-v2.html -> backend/public/index-v2.html");
