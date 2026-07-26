import http from "node:http";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const videoRoot = path.join(root, "assets", "hero-videos");

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname.startsWith("/assets/hero-videos/")) {
    const filename = path.basename(decodeURIComponent(url.pathname));
    const filePath = path.join(videoRoot, filename);

    try {
      const stat = await fs.stat(filePath);
      const range = request.headers.range;
      const commonHeaders = {
        "content-type": "video/mp4",
        "accept-ranges": "bytes",
        "cache-control": "public, max-age=3600"
      };

      if (range) {
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
