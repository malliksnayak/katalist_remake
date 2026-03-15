# Katalist Remake 🎬

Katalist Remake is a powerful AI-driven storyboard and video generation platform. It transforms text stories into structured storyboards with AI-generated images, lifelike narrations, and compiled MP4 videos.

## 🚀 Key Features

- **AI Storyboarding**: Automatically break down stories into sequential scenes with AI-generated scripts and image prompts.
- **Audio Studio**: 
  - Generate narrations using the **Kokoro TTS** engine.
  - Mix and match different voices for each scene.
  - Smart regeneration: Detects voice changes and updates audio automatically.
- **Visual Studio**:
  - Generate consistent images via **RunPod (Stable Diffusion)**.
  - Automatic letterboxing (16:9) to ensure cinematic aspect ratios without stretching.
- **Video Production**:
  - Native JavaCV-based video rendering (No FFmpeg installation required).
  - Precise 1-second pacing between scenes with silent audio alignment.
  - Frame-accurate audio-video synchronization.

## 🛠️ Tech Stack

- **Backend**: Java 17, Spring Boot, PostgreSQL, Liquibase, JavaCV.
- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI, TanStack Query.
- **AI Providers**: 
  - **Narration**: Kokoro TTS (Self-hosted/API).
  - **Images**: RunPod / Stable Diffusion.
  - **Story**: OpenAI / LLM-based script generation.

## ⚙️ Configuration

Create a `.env` file in the root directory:

```properties
# RunPod Settings
RUNPOD_API_KEY=your_runpod_key_here
# OPENROUTER Settings
OPENROUTER_API_KEY=your_openrouter_key_here
# Kokoro TTS Settings
KOKORO_SERVICE_URL=http://localhost:8000/audio

# Postgres Settings
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/katalist
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password

# Video Storage
STORAGE_PATH=./storage
```

## 🏗️ Getting Started

### Prerequisites
- JDK 17
- Node.js 20+
- PostgreSQL

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd katalist-remake
   ```

2. **Frontend setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend setup**:
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

## 📂 Project Structure

- `src/main/java`: Spring Boot backend logic.
- `src/main/resources/db/changelog`: SQL migrations via Liquibase.
- `frontend/src/app`: Next.js pages (Storyboard, Audio Studio, Video Production).
- `frontend/src/components/ui`: Shared UI components.

## 📄 License

MIT
