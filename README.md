# Content Killer <img src="./img/skull.svg" alt="Skull" width="28" height="28" style="margin-bottom: -5px; text-align: center;" />

<div align="center">
  
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An experimental AI-powered YouTube video commentary generator that transforms source videos into analytical content.

[Demo](#demo) · [Setup](#setup) · [Architecture](#architecture)

</div>

## Overview

Content Killer is an experiment in automated video content generation, exploring the possibilities of AI in video editing and commentary creation. It uses prompt chaining to analyse, describe, and generate professional commentary & editing for YouTube videos in several steps.

<img src="./img/project-view.png" alt="Content Killer Interface" width="100%" style="border-radius: 10px; margin: 20px 0; display: block; margin-left: auto; margin-right: auto;" />

### Demo

| Source video                                                                                          | AI-generated output (no manual editing)                                                 |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [![Input](https://img.youtube.com/vi/iEmDdWZOmo4/0.jpg)](https://www.youtube.com/watch?v=iEmDdWZOmo4) | [![Output](https://img.youtube.com/vi/-1jVvmsGL4Y/0.jpg)](https://youtu.be/-1jVvmsGL4Y) |

## Architecture

### Pipeline

1. **Video Analysis**: Uses Gemini Vision for scene comprehension and description
2. **Commentary Generation**: OpenAI for commentary generation
3. **Voice Synthesis**: ElevenLabs for voice synthesis
4. **Video Processing**: FFmpeg for video manipulation and assembly based on generated commentary and settings

Customisation is possible by changing the settings at each step. Project and template states are stored in the database.

### Tech stack

- **Frontend**: React, TypeScript, TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Bun Runtime, Hono, FFmpeg, SQLite
- **AI Services**: Gemini API, OpenAI API, ElevenLabs API

## Setup

### Prerequisites

- [ffmpeg](https://ffmpeg.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- API keys for [Gemini](https://gemini.google.com/), [OpenAI](https://platform.openai.com/), and [ElevenLabs](https://elevenlabs.io/)

```bash
git clone https://github.com/yourusername/content-killer.git
cd content-killer
bun install

# Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start development
bun run dev
```

## Features

### Project Management

<img src="./img/template-view.png" alt="Template Management" width="100%" style="border-radius: 10px; margin: 20px 0; display: block; margin-left: auto; margin-right: auto;" />

- Template system for multiple channel styles
- Local project storage for both projects and templates
- Custom pause sounds & generation settings

### Manual editing

<img src="./img/edit-commentary.png" alt="Commentary Editor" width="100%" style="border-radius: 10px; margin: 20px 0; display: block; margin-left: auto; margin-right: auto;" />

- Edit the generated description/commentary in a custom json editor

## License

MIT License - See [LICENSE](LICENSE) for details.
