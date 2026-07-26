import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const html = await fs.readFile(path.join(root, "index.html"), "utf8");
const dist = path.join(root, "dist");
const server = path.join(dist, "server");
const client = path.join(dist, "client");

await fs.mkdir(server, { recursive: true });
await fs.mkdir(client, { recursive: true });
await fs.cp(path.join(root, "assets"), path.join(client, "assets"), { recursive: true });

const worker = `
const html = ${JSON.stringify(html)};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=0, must-revalidate",
          "x-content-type-options": "nosniff",
          "referrer-policy": "strict-origin-when-cross-origin"
        }
      });
    }
    return new Response("Not found", { status: 404 });
  }
};
`;

await fs.writeFile(path.join(server, "index.js"), worker, "utf8");
await fs.writeFile(path.join(client, "index.html"), html, "utf8");
console.log("Built interactive presentation.");
