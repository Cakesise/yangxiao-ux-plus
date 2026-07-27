import http from "node:http";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const assetsRoot = path.join(root, "assets");
const contentTypes = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webp": "image/webp"
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname.startsWith("/assets/")) {
    const relativePath = decodeURIComponent(url.pathname.slice("/assets/".length));
    const filePath = path.resolve(assetsRoot, relativePath.replaceAll("/", path.sep));

    if (filePath !== assetsRoot && !filePath.startsWith(`${assetsRoot}${path.sep}`)) {
      response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    try {
      const stat = await fs.stat(filePath);
      const range = request.headers.range;
      const contentType = contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      const commonHeaders = {
        "content-type": contentType,
        "accept-ranges": contentType === "video/mp4" ? "bytes" : "none",
        "cache-control": "public, max-age=3600"
      };

      if (range && contentType === "video/mp4") {
        const [startText, endText] = range.replace("bytes=", "").split("-");
        const start = Number(startText);
        const end = Math.min(endText ? Number(endText) : stat.size - 1, stat.size - 1);

        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= stat.size) {
          response.writeHead(416, {
            ...commonHeaders,
            "content-range": `bytes */${stat.size}`
          });
          response.end();
          return;
        }

        response.writeHead(206, {
          ...commonHeaders,
          "content-range": `bytes ${start}-${end}/${stat.size}`,
          "content-length": end - start + 1
        });
        createReadStream(filePath, { start, end }).pipe(response);
        return;
      }

      response.writeHead(200, {
        ...commonHeaders,
        "content-length": stat.size
      });
      createReadStream(filePath).pipe(response);
      return;
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
  }

  if (url.pathname !== "/" && url.pathname !== "/index.html") {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const html = await fs.readFile(path.join(root, "index.html"), "utf8");
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(html);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local URL: http://127.0.0.1:${port}`);
});
