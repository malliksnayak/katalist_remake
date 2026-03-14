# Task: Implement Strategy Pattern for Narration (TTS) Integration

## Context
I am building **Katalist Remake**, a Spring Boot application that generates video storyboards. I need a decoupled architecture for Text-to-Speech (TTS) so I can switch between a local Dockerized Kokoro service and other providers (like OpenAI or ElevenLabs) via configuration.

## Requirements

### 1. Domain Interface
Create `com.katalist.katalistremake.service.narration.NarrationProvider`:
- Method: `byte[] generateAudio(String text, String voice)`
- Method: `String getProviderName()`

### 2. Kokoro Implementation (FastAPI Bridge)
Create `com.katalist.katalistremake.service.narration.KokoroNarrationService`:
- It must implement `NarrationProvider`.
- Use `RestTemplate` or `WebClient` to POST to `${kokoro.service.url}`.
- **Request Body:** Must match the FastAPI `TextRequest` model: 
  `{"text": string, "voice": string, "speed": 1.0, "lang": "en-us"}`.
- **Response Handling:** Decode the `base64` string returned by the FastAPI service into a `byte[]`.
- **Conditional Loading:** Annotate with `@ConditionalOnProperty(name = "video.narration.provider", havingValue = "kokoro")`.

### 3. Orchestration & Storage
Create `com.katalist.katalistremake.service.narration.NarrationOrchestrator`:
- This service should take a `Storyboard` object.
- It should iterate through `scenes`, call the active `NarrationProvider`, and save the resulting bytes as `.wav` files.
- **Naming Convention:** `storage/{storyId}/scene_{sceneOrder}.wav`.

### 4. Configuration
Update `application.properties`:
- Add `video.narration.provider=kokoro`
- Add `kokoro.service.url=http://localhost:8000/audio`
- Add `storage.path=./storage`

## Technical Details
- Use **Lombok** for any new DTOs.
- Add `SLF4J` logging to track the start and end of audio generation for each scene.
- Ensure the `storage` directory is created automatically if it doesn't exist.