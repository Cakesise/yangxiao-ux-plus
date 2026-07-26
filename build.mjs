import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const html = await fs.readFile(path.join(root, "index.html"), "utf8");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(client, { recursive: true });
await fs.cp(path.join(root, "assets"), path.join(client, "assets"), { recursive: true });

await fs.writeFile(path.join(client, "index.html"), html, "utf8");
await fs.writeFile(path.join(client, ".nojekyll"), "", "utf8");
console.log("Built static presentation for GitHub Pages.");
