# Content Killer <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-skull"><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="12" r="1"/></svg>

A web app for content generation and management built with React, TypeScript, and Bun.

## Prerequisites

- [Bun](https://bun.sh/) (Latest version)
- [FFmpeg](https://ffmpeg.org/) - Required for video processing
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Required for video downloading

## Project Structure

```
content-killer/
├── client/           # React app
├── server/           # Bun server
└── shared/           # Shared types and utilities
```

## Getting Started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start development servers:

   ```bash
   bun run dev
   ```

   This will start both the client and server in development mode:

   - Client: [http://localhost:5173](http://localhost:5173)
   - Server: [http://localhost:3000](http://localhost:3000)

## Development

- `bun run dev` - Start development servers
- `bun run build` - Build all packages

## Tech Stack

- **Frontend**:

  - React + TypeScript
  - Tailwind CSS
  - Shadcn UI
  - TanStack Query
  - React Router
  - Hono Client

- **Backend**:
  - Bun
  - Hono
  - FFmpeg for video processing
  - yt-dlp for video downloading

## License

MIT
