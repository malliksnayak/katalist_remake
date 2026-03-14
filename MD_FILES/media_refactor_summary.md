# Media Storage Refactor Implementation

The application has been refactored to store generated media (audio and images) directly in the database instead of the local file system.

## Database Schema Changes

A new Liquibase changeset `03-media-refactor.xml` was added to:
1.  **Create `audios` table**: Stores base64 audio data linked to a scene.
2.  **Create `images` table**: Stores base64 image data linked to a scene.
3.  **Refactor `scenes` table**: Removed `generated_audio_url` and `audio_base64` columns to decouple media data from scene metadata.

## Backend Refactoring

### 1. New Models & Repositories
- **[Audio.java](file:///Users/malliknayak/WS/katalist_remake/src/main/java/com/katalist/katalistremake/model/Audio.java)**: Represents the audio asset for a scene.
- **[Image.java](file:///Users/malliknayak/WS/katalist_remake/src/main/java/com/katalist/katalistremake/model/Image.java)**: Represents the image asset for a scene.
- **[AudioRepository.java](file:///Users/malliknayak/WS/katalist_remake/src/main/java/com/katalist/katalistremake/repository/AudioRepository.java)**: Data access for audio.
- **[ImageRepository.java](file:///Users/malliknayak/WS/katalist_remake/src/main/java/com/katalist/katalistremake/repository/ImageRepository.java)**: Data access for images.

### 2. Service Updates
- **[NarrationOrchestrator.java](file:///Users/malliknayak/WS/katalist_remake/src/main/java/com/katalist/katalistremake/service/narration/NarrationOrchestrator.java)**: 
    - Removed dependency on `storagePath`.
    - Now saves generated audio bytes as Base64 strings into the `AudioRepository` linked to the respective `Scene`.
- **[AudioController.java](file:///Users/malliknayak/WS/katalist_remake/src/main/java/com/katalist/katalistremake/controller/AudioController.java)**:
    - Removed `media/audio/` directory management.
    - `generateAudio` endpoint now returns `audioBase64` data instead of a URL.

## Frontend Refactoring

### 1. API Definitions
- **[api.ts](file:///Users/malliknayak/WS/katalist_remake/frontend/src/lib/api.ts)**:
    - Added `Audio` and `Image` interfaces.
    - Updated `Scene` interface to include optional `audio` and `image` objects.
    - `generateAudio` now returns the base64 string directly.

### 2. UI Components
- **[SceneCard.tsx](file:///Users/malliknayak/WS/katalist_remake/frontend/src/components/SceneCard.tsx)**:
    - Updated `handlePlayAudio` to check for `scene.audio.audioBase64`.
    - Correctly handles playback using Data URLs (`data:audio/wav;base64,...`).

## Verification
- Clean build performed: `mvn clean compile` - **SUCCESS**.
- Database schema aligned via Liquibase.
- No physical files are created in the `media` directory during audio generation.
