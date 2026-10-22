/** Disposable loopback request counter: no database, forwarding, body storage or app imports. */
import { createServer } from "node:http";

export async function startCanaryServer() {
  const counts = { control: 0, held: 0, aborted: 0, offline: 0 };
  const server = createServer((request, response) => {
    request.resume(); // Consume and discard synthetic bodies; never retain/log them.
    response.setHeader("Cache-Control", "no-store");
    if ("authorization" in request.headers || "cookie" in request.headers) {
      response.writeHead(400).end();
      return;
    }
    const path = request.url;
    if (request.method === "GET" && path === "/") {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.setHeader("Content-Security-Policy", "default-src 'none'; connect-src 'self'");
      response.end("<!doctype html><title>Disposable request canary</title><h1>Request isolation fixture</h1>");
    } else if (request.method === "GET" && path === "/counts") {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(counts));
    } else if (request.method === "POST" && /^\/canary\/(control|held|aborted|offline)$/.test(path ?? "")) {
      counts[path.slice("/canary/".length)] += 1;
      response.writeHead(204).end();
    } else {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  if ([3000, 3001].includes(port)) {
    await new Promise(resolve => server.close(resolve));
    throw new Error("Canary must not use application ports");
  }
  return {
    origin: `http://127.0.0.1:${port}`,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    },
  };
}
