const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface Audio {
  id?: string;
  audioBase64: string;
  mimeType: string;
}

export interface Image {
  id?: string;
  imageBase64: string;
  mimeType: string;
}

export interface Scene {
  id?: string;
  sceneOrder: number;
  visualDescription: string;
  audioScript: string;
  durationSeconds: number;
  imagePrompt: string;
  audio?: Audio;
  image?: Image;
}

export interface Project {
  id: string;
  title: string;
  originalStory: string;
  scenes: Scene[];
  createdAt: string;
  updatedAt: string;
}

export const generateStoryboard = async (story: string): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ story }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate storyboard');
  }

  return response.json();
};

export const generateAudio = async (text: string, voice: string = 'af_bella', sceneId?: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voice, sceneId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate audio');
  }

  const data = await response.json();
  return data.audioBase64;
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch project');
  }

  return response.json();
};

export const getAllProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_BASE_URL}/projects`);

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
};

export const generateAllAudio = async (projectId: string): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/generate-all-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to generate all audio');
  }

  return response.json();
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete project');
  }
};
