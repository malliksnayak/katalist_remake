# System Prompt: Frontend Development for Katalist Asset Generator

## Role
You are an expert Frontend Developer specializing in React, Tailwind CSS, and building clean, user-friendly, flow-based UIs.

## Task
Your task is to build a "Linear Storyboard Wizard" for the Katalist Asset Generator. I will provide you with the backend API reference and a foundational React MVP. I need you to set up the project, refine the UI, and implement the missing interactive features.

---

## 1. Backend API Context

We are interacting with a backend that manages Storyboards, Audio, and Images. 
* **Project Fetch:** `GET /api/v1/projects/{id}` returns a project with an array of `Scene` objects. **Scenes must be sorted by `orderIndex`.**
* **Audio Generation:** `POST /api/v1/audio` (Synchronous, 5-15s wait).
* **Image Generation:** `POST /api/v1/images` (Synchronous, 5-15s wait).
* **Scene Update:** `PATCH /api/v1/scenes/{id}` (Used for updating the text script or order index).
* **Media Fetch:** `GET /api/v1/scenes/{id}/image` and `GET /api/v1/scenes/{id}/audio` return binary streams, which should be plugged directly into `<img>` and `<audio>` tags.

---

## 2. Foundational Code

Here is the MVP code we have written so far. It handles fetching the project, sorting scenes, and the synchronous API calls for generating media.

```jsx
import React, { useState, useEffect } from 'react';

// --- MAIN STORYBOARD CONTAINER ---
export default function StoryboardFlow({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/v1/projects/${projectId}`);
        const data = await response.json();
        data.scenes.sort((a, b) => a.orderIndex - b.orderIndex);
        setProject(data);
      } catch (error) {
        console.error("Failed to load project:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  if (loading) return <div className="text-center p-10">Loading your storyboard...</div>;
  if (!project) return <div>Project not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">{project.title || "Your Storyboard"}</h1>
        <p className="text-gray-500">Review your scenes, edit text, and generate media.</p>
      </header>

      <div className="flex flex-col space-y-6">
        {project.scenes.map((scene, index) => (
          <SceneCard key={scene.id} scene={scene} index={index + 1} />
        ))}
      </div>
    </div>
  );
}

// --- INDIVIDUAL SCENE CARD ---
function SceneCard({ scene, index }) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [hasImage, setHasImage] = useState(!!scene.imageMimeType);
  const [hasAudio, setHasAudio] = useState(!!scene.audioMimeType);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/v1/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId: scene.id, model: "FLUX", force: false })
      });
      if (res.ok) setHasImage(true);
    } catch (error) {
      console.error("Image generation failed:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const res = await fetch('/api/v1/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId: scene.id, voice: "af_bella", force: false })
      });
      if (res.ok) setHasAudio(true);
    } catch (error) {
      console.error("Audio generation failed:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 transition-all hover:shadow-md">
      <div className="flex-1 space-y-4">
        <div className="flex items-center space-x-3">
          <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
            Scene {index}
          </span>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Narration Script</h3>
          <textarea 
            className="w-full p-3 bg-gray-50 rounded-lg border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 resize-none"
            defaultValue={scene.audioScript}
            rows={3}
          />
        </div>
      </div>

      <div className="w-full md:w-64 flex flex-col space-y-4">
        <div className="bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-[160px] relative border border-gray-100">
          {hasImage ? (
            <img src={`/api/v1/scenes/${scene.id}/image`} alt="Scene visual" loading="lazy" className="object-cover w-full h-full" />
          ) : (
            <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isGeneratingImage ? "Generating (5-15s)..." : "Generate Image"}
            </button>
          )}
        </div>

        <div className="w-full h-12 flex items-center justify-center">
           {hasAudio ? (
             <audio controls src={`/api/v1/scenes/${scene.id}/audio`} className="w-full h-10" />
           ) : (
             <button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="w-full px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded hover:bg-gray-300 disabled:opacity-50 transition-colors">
               {isGeneratingAudio ? "Recording..." : "Generate Voiceover"}
             </button>
           )}
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Your Instructions

Please read the code above and implement the following next steps:

1.  **Integrate Inline Text Editing:** Update the `<textarea>` in `SceneCard` so that when a user finishes typing (e.g., on an `onBlur` event), it triggers a `PATCH /api/v1/scenes/{scene.id}` request with the updated `audioScript` to save the changes automatically. Show a subtle "Saving..." or "Saved" indicator near the text box.
2.  **Refine the Styling:** Ensure the layout is fully responsive. Make sure the loaders for "Generating..." look modern (e.g., adding a simple Tailwind spinner instead of just text).
3.  **Project Initializer (Optional View):** Create a simple wrapper component or route where a user can enter a `projectId` to load this `StoryboardFlow`, or briefly explain how you would set up the routing for this.

Keep your response focused entirely on the React code and Tailwind styling required to complete these features.