#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Configuration
const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, "build");

// MIME types for common file extensions
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
};

// Get MIME type based on file extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// Check if build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error(
    '❌ Build directory not found. Please run "pnpm run build" first.'
  );
  process.exit(1);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Handle root path
  if (pathname === "/") {
    pathname = "/index.html";
  }

  // Construct file path
  const filePath = path.join(BUILD_DIR, pathname);

  // Security check: ensure file is within build directory
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(BUILD_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // For SPA routing: serve index.html for non-existent routes
      if (
        pathname !== "/index.html" &&
        !pathname.startsWith("/assets/") &&
        !pathname.includes(".")
      ) {
        const indexPath = path.join(BUILD_DIR, "index.html");
        fs.readFile(indexPath, (err, data) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
          } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
          }
        });
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      }
      return;
    }

    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        return;
      }

      const mimeType = getMimeType(filePath);
      const headers = {
        "Content-Type": mimeType,
        "Cache-Control": pathname.startsWith("/assets/")
          ? "public, max-age=31536000"
          : "no-cache",
      };

      res.writeHead(200, headers);
      res.end(data);
    });
  });
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Please try a different port.`
    );
    console.error(
      `   You can set a different port with: PORT=3001 node serve.js`
    );
  } else {
    console.error("❌ Server error:", err.message);
  }
  process.exit(1);
});

// Start server
server.listen(PORT, () => {
  console.log("🚀 Static server running!");
  console.log(`📂 Serving: ${BUILD_DIR}`);
  console.log(`🌐 Local:   http://localhost:${PORT}`);
  console.log(`🔗 Network: http://${getLocalIP()}:${PORT}`);
  console.log("");
  console.log("Press Ctrl+C to stop the server");
});

// Get local IP address
function getLocalIP() {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "localhost";
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});
