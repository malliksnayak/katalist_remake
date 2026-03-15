import { useState, useEffect, useCallback } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  RefreshCw, 
  Trash2, 
  Loader2,
  Check,
  Type,
  ImageIcon
} from "lucide-react";
import { Scene, generateAudio, generateImage, updateScene } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

interface SceneCardProps {
  scene: Scene;
  onUpdateScene?: (updatedScene: Scene) => void;
  onDelete?: (id: string) => void;
  imageModel?: string;
}

export function SceneCard({ scene, onUpdateScene, onDelete, imageModel = "FLUX" }: SceneCardProps) {
  const [audioScript, setAudioScript] = useState(scene.audioScript);
  const [imagePrompt, setImagePrompt] = useState(scene.imagePrompt);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);

  // Auto-save mutation
  const saveMutation = useMutation({
    mutationFn: (updates: Partial<Scene>) => updateScene(scene.id!, updates),
    onSuccess: (updated) => {
      if (onUpdateScene) onUpdateScene(updated);
    }
  });

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (audioScript !== scene.audioScript || imagePrompt !== scene.imagePrompt) {
        saveMutation.mutate({ audioScript, imagePrompt });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [audioScript, imagePrompt, scene.id]);

  const handlePlayAudio = async () => {
    try {
      let audioData = scene.audio?.audioBase64 || cachedAudioUrl;
      
      if (!audioData) {
        setIsGenerating(true);
        const base64 = await generateAudio(audioScript, 'af_bella', scene.id || undefined);
        audioData = base64;
        setCachedAudioUrl(base64);
        setIsGenerating(false);
      }

      setIsPlaying(true);
      const dataUrl = audioData!.startsWith('data:') ? audioData! : `data:audio/wav;base64,${audioData}`;
      const audioObject = new window.Audio(dataUrl);
      audioObject.onended = () => setIsPlaying(false);
      await audioObject.play();
    } catch (error) {
      console.error("Audio error:", error);
      setIsPlaying(false);
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    try {
      setIsImageGenerating(true);
      const base64 = await generateImage(imagePrompt, scene.id || undefined, imageModel);
      setIsImageGenerating(false);
      
      if (onUpdateScene) {
        onUpdateScene({
          ...scene,
          image: { imageBase64: base64, mimeType: 'image/png' }
        });
      }
    } catch (error) {
      console.error("Image error:", error);
      setIsImageGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Script Section */}
      <Card className="bg-card border-border overflow-hidden rounded-2xl shadow-xl backdrop-blur-md">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center font-heading">
              <Type className="h-3 w-3 mr-2 text-secondary" /> Voiceover Script
            </span>
            {saveMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : (
              <Check className="h-3 w-3 text-green-500 opacity-50" />
            )}
        </div>
        <div className="p-5 space-y-4">
          <TextareaAutosize
            value={audioScript}
            onChange={(e) => setAudioScript(e.target.value)}
            minRows={3}
            className="w-full bg-transparent border-none p-0 text-sm font-medium leading-relaxed resize-none focus:ring-0 text-foreground placeholder:text-muted-foreground/30 outline-none font-sans"
            placeholder="What should the narrator say?"
            disabled={isGenerating || isPlaying}
          />
          <Button 
            onClick={handlePlayAudio} 
            disabled={isPlaying || isGenerating || !audioScript.trim()}
            variant="secondary"
            className="w-full h-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border shadow-lg active:scale-[0.98] transition-all font-heading text-[11px] font-black uppercase tracking-widest"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> GENERATING V.O...</>
            ) : isPlaying ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> PLAYING PREVIEW...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> PREVIEW VOICE</>
            )}
          </Button>
        </div>
      </Card>

      {/* Image Prompt Section */}
      <Card className="bg-card border-border overflow-hidden rounded-2xl shadow-xl backdrop-blur-md">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center font-heading">
              <ImageIcon className="h-3 w-3 mr-2 text-primary" /> Visual Prompt
            </span>
        </div>
        <div className="p-5 space-y-4">
          <TextareaAutosize
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            minRows={3}
            className="w-full bg-transparent border-none p-0 text-xs font-semibold leading-relaxed resize-none focus:ring-0 text-muted-foreground placeholder:text-muted-foreground/30 outline-none italic font-sans"
            placeholder="Describe the scene visuals..."
            disabled={isImageGenerating}
          />
          <Button 
            onClick={handleGenerateImage} 
            disabled={isImageGenerating || !imagePrompt.trim()}
            variant="default"
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 active:scale-[0.98] transition-all font-heading text-[11px] font-black uppercase tracking-widest"
          >
            {isImageGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> RENDERING CLOUD...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> REGENERATE SCENE</>
            )}
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <div className="pt-4 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => scene.id && onDelete?.(scene.id)}
          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg text-[10px] font-black uppercase tracking-widest font-heading transition-colors"
        >
          <Trash2 className="h-3 w-3 mr-2" /> Delete Scene
        </Button>
      </div>
    </div>
  );
}
