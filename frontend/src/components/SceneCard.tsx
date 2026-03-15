import { useState, useMemo, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Play, 
  RefreshCw, 
  Image as ImageIcon, 
  Trash2, 
  Settings2,
  ChevronDown,
  Loader2,
  Check
} from "lucide-react";
import { Scene, generateAudio, generateImage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SceneCardProps {
  scene: Scene;
  onUpdateScene?: (updatedScene: Scene) => void;
  onDelete?: (id: string) => void;
  imageModel?: string;
}

export function SceneCard({ scene, onUpdateScene, onDelete, imageModel = "SDXL TURBO" }: SceneCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [audioScript, setAudioScript] = useState(scene.audioScript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);
  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState(scene.imagePrompt);

  useEffect(() => {
    setAudioScript(scene.audioScript);
    setImagePrompt(scene.imagePrompt);
    if (scene.audio?.audioBase64) setCachedAudioUrl(null);
    if (scene.image?.imageBase64) setCachedImageUrl(null);
  }, [scene.audioScript, scene.imagePrompt, scene.audio?.audioBase64, scene.image?.imageBase64]);

  const audioStatus = useMemo(() => {
    if (isGenerating) return 'processing';
    if (scene.audio?.audioBase64 || cachedAudioUrl) return 'ready';
    return 'uncached';
  }, [scene.audio, cachedAudioUrl, isGenerating]);

  const handlePlayAudio = async () => {
    try {
      let audioData = scene.audio?.audioBase64;
      
      if (audioData) {
        // DB cache
      } else if (cachedAudioUrl) {
        audioData = cachedAudioUrl; // local session
      } else {
        setIsGenerating(true);
        const base64 = await generateAudio(audioScript, 'af_bella', scene.id || undefined);
        audioData = base64;
        setCachedAudioUrl(base64);
        setIsGenerating(false);
      }

      if (!audioData) throw new Error("Audio empty");
      
      setIsPlaying(true);
      const dataUrl = audioData.startsWith('data:') 
        ? audioData 
        : `data:audio/wav;base64,${audioData}`;
      
      const audioObject = new window.Audio(dataUrl);
      audioObject.onended = () => setIsPlaying(false);
      await audioObject.play();
    } catch (error) {
      console.error("Audio error:", error);
      setIsPlaying(false);
      setIsGenerating(false);
      alert("Failed to play audio");
    }
  };

  const handleGenerateImage = async () => {
    try {
      setIsImageGenerating(true);
      const base64 = await generateImage(imagePrompt, scene.id || undefined, imageModel);
      setCachedImageUrl(base64);
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
      alert("Failed to generate image");
    }
  };

  const hasImage = !!(cachedImageUrl || scene.image?.imageBase64);

  return (
    <Card className={cn(
      "w-full max-w-4xl mx-auto overflow-hidden border-0 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative rounded-2xl group transition-all duration-300",
      hasImage ? "ring-1 ring-white/10" : "border border-slate-800 border-dashed"
    )}>
      
      {/* Floating Toolbar (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={handleGenerateImage}
          disabled={isImageGenerating}
          className="h-9 w-9 rounded-full bg-slate-800/80 backdrop-blur-md hover:bg-slate-700 text-slate-300 shadow-xl"
          title="Regenerate Image"
        >
          <RefreshCw className={cn("h-4 w-4", isImageGenerating && "animate-spin")} />
        </Button>
        <Button 
          variant="destructive" 
          size="icon" 
          onClick={() => scene.id && onDelete?.(scene.id)}
          className="h-9 w-9 rounded-full bg-red-900/50 backdrop-blur-md hover:bg-red-800 text-red-200 shadow-xl"
          title="Delete Scene"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Visual Canvas */}
      <div className="relative w-full aspect-video bg-black/60 border-b border-white/5 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <img 
            src={`data:image/png;base64,${cachedImageUrl || scene.image?.imageBase64}`} 
            className="w-full h-full object-contain animate-in fade-in duration-700 blur-[2px] transition-all group-hover:blur-0" 
            style={{ filter: "drop-shadow(0 0 40px rgba(0,0,0,0.5))" }}
            alt={scene.imagePrompt}
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center shadow-inner">
              {isImageGenerating ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-500" />
              )}
            </div>
            {!isImageGenerating && (
              <Button onClick={handleGenerateImage} variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 rounded-full">
                Generate Visual Layout
              </Button>
            )}
          </div>
        )}
        
        {/* Status Indicators (Subtle Glow Dots) */}
        {(hasImage || audioStatus === 'ready') && (
           <div className="absolute top-4 left-4 z-20 flex gap-2">
              {hasImage && <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" title="Visual Ready" />}
              {audioStatus === 'ready' && <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" title="Audio Ready" />}
           </div>
        )}
      </div>

      {/* Interactive Script & Voiceover Panel */}
      <div className="p-6 bg-gradient-to-b from-slate-900/40 to-slate-950/80">
        <div className="flex items-start gap-4">
          <Button 
            onClick={handlePlayAudio} 
            disabled={isPlaying || isGenerating || !audioScript.trim()}
            className={cn(
               "h-14 w-14 rounded-full flex-shrink-0 shadow-lg transition-all",
               isPlaying || isGenerating ? "bg-primary text-primary-foreground" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            )}
            title="Play Voiceover"
          >
            {isGenerating || isPlaying ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6 fill-current ml-1" />}
          </Button>

          <div className="flex-1 space-y-2 group/editor">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Narration Script</Label>
            <TextareaAutosize
              value={audioScript}
              onChange={(e) => {
                setAudioScript(e.target.value);
                setCachedAudioUrl(null);
              }}
              minRows={2}
              className="w-full bg-transparent border-none p-0 text-xl font-medium leading-relaxed resize-none focus:ring-0 text-slate-200 placeholder:text-slate-600 outline-none transition-colors"
              placeholder="Enter the voiceover script here..."
            />
            {audioStatus === 'ready' && <div className="flex items-center text-xs text-blue-400 opacity-60 ml-1"><Check className="h-3 w-3 mr-1" /> Audio synced</div>}
          </div>
        </div>

        {/* Scene Settings (Simplified) */}
        <div className="mt-8 border-t border-slate-800/50 pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">AI Image Prompt</Label>
            <TextareaAutosize 
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              minRows={1}
              className="w-full bg-slate-950/30 border border-slate-800/50 rounded-xl p-4 text-sm font-medium text-slate-400 focus:ring-1 focus:ring-primary/40 resize-none transition-all hover:bg-slate-950/50"
              placeholder="Visual instructions for the AI..."
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
