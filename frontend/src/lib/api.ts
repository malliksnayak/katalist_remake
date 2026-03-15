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

export const generateStoryboard = async (story: string, visualStyle?: string): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ story, visualStyle }),
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

export const getVoices = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/audio/voices`);
  if (!response.ok) {
    return ["af_bella", "af_nicole", "af_sarah", "am_adam", "am_michael"];
  }
  const data = await response.json();
  return data.available_voices || [];
};

export const generateImage = async (prompt: string, sceneId?: string, model: string = 'FLUX'): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, sceneId, model }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const data = await response.json();
  return data.imageBase64;
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

export const generateAllAudio = async (projectId: string, voice?: string): Promise<Project> => {
  let url = `${API_BASE_URL}/projects/${projectId}/generate-all-audio`;
  const params = new URLSearchParams();
  if (voice) params.append('voice', voice);
  url += `?${params.toString()}`;

  const response = await fetch(url, {
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

export const generateAllImages = async (projectId: string, imageModel: string = 'FLUX'): Promise<Project> => {
  let url = `${API_BASE_URL}/projects/${projectId}/generate-all-images`;
  const params = new URLSearchParams();
  params.append('imageModel', imageModel);
  url += `?${params.toString()}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to generate all images');
  }

  return response.json();
};

export const generateAllAssets = async (projectId: string, voice?: string, imageModel: string = 'FLUX'): Promise<Project> => {
  let url = `${API_BASE_URL}/projects/${projectId}/generate-all-assets`;
  const params = new URLSearchParams();
  if (voice) params.append('voice', voice);
  params.append('imageModel', imageModel);
  
  url += `?${params.toString()}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to generate all assets');
  }

  return response.json();
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update project');
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

export const getVideoDownloadUrl = (projectId: string): string => {
  return `${API_BASE_URL}/video/download/${projectId}`;
};

export const updateScene = async (id: string, updates: Partial<Scene>): Promise<Scene> => {
  const response = await fetch(`${API_BASE_URL}/scenes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update scene');
  }

  return response.json();
};

export const deleteSceneFromApi = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/scenes/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete scene');
  }
};

export const downloadVideo = async (projectId: string, filename: string = 'video.mp4') => {
  const url = getVideoDownloadUrl(projectId);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to download video');
  }
  
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
};
