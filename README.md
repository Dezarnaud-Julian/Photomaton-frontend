# Photomaton Frontend

A React + Vite application for the Photomaton project.

## Quick Start

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env to set backend address properly
   ```

3. **Development**
   ```bash
   pnpm run dev
   ```

## Available Scripts

### Development

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build (Vite's built-in server)

### Production Serving

- `pnpm run serve` - Serve production build with Node.js static server
- `pnpm run start` - Build and serve (complete production setup)

## Production Deployment

### Option 1: Build and Serve (Recommended)

```bash
# Complete production setup
pnpm run start
```

### Option 2: Manual Steps

```bash
# Build the application
pnpm run build

# Serve the build with Node.js
pnpm run serve
```

### Option 3: Custom Port

```bash
# Serve on a different port
PORT=8080 pnpm run serve
```

## Server Features

The included Node.js static server (`serve.js`) provides:

- ✅ Static file serving with proper MIME types
- ✅ SPA routing support (fallback to index.html)
- ✅ Asset caching headers for optimal performance
- ✅ Security checks to prevent directory traversal
- ✅ Graceful shutdown handling
- ✅ Network interface detection for easy access
- ✅ Cross-platform compatibility

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_BACKEND_ADRESS=http://127.0.0.1:3001
```

> **Note**: Environment variables must be prefixed with `VITE_` to be accessible in the application.

## Build Output

The production build creates a `build/` directory containing:

- Optimized JavaScript bundles
- CSS files with vendor prefixes
- Static assets (images, fonts, etc.)
- HTML file with injected script tags

## Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Styling**: CSS
- **Routing**: React Router
