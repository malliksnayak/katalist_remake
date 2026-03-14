import { useState, useMemo, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Play, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Settings2
} from "lucide-react";
import { Scene, generateAudio, generateImage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SceneCardProps {
  scene: Scene;
  onUpdateScene?: (updatedScene: Scene) => void;
  onDelete?: (id: string) => void;
}

export function SceneCard({ scene, onUpdateScene, onDelete }: SceneCardProps) {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [audioScript, setAudioScript] = useState(scene.audioScript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);
  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState(scene.imagePrompt);

  // Sync state when props change (especially after batch generation)
  useEffect(() => {
    setAudioScript(scene.audioScript);
    setImagePrompt(scene.imagePrompt);
    // When the prop update brings in new DB assets, clear the local session cache
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
      console.log(`[Scene ${scene.sceneOrder}] Play clicked. ID: ${scene.id}`);
      
      let audioData = scene.audio?.audioBase64;
      
      if (audioData) {
        console.log(`[Scene ${scene.sceneOrder}] Success: Found audio in scene object (fetched from DB).`);
      } else if (cachedAudioUrl) {
        console.log(`[Scene ${scene.sceneOrder}] Info: Audio not in scene object, but found in session cache.`);
        audioData = cachedAudioUrl;
      } else {
        console.log(`[Scene ${scene.sceneOrder}] Info: No existing audio found. Calling API to check/generate...`);
        setIsGenerating(true);
        const base64 = await generateAudio(audioScript, 'af_bella', scene.id || undefined);
        audioData = base64;
        setCachedAudioUrl(base64);
        setIsGenerating(false);
        console.log(`[Scene ${scene.sceneOrder}] Success: Received audio from API.`);
      }

      if (!audioData) throw new Error("Audio data is empty");
      
      setIsPlaying(true);
      const dataUrl = audioData.startsWith('data:') 
        ? audioData 
        : `data:audio/wav;base64,${audioData}`;
      
      const audioObject = new window.Audio(dataUrl);
      audioObject.onended = () => setIsPlaying(false);
      await audioObject.play();
    } catch (error) {
      console.error("Failed to play audio:", error);
      setIsPlaying(false);
      setIsGenerating(false);
      alert("Failed to generate and play audio");
    }
  };

  const handleGenerateImage = async () => {
    try {
      console.log(`[Scene ${scene.sceneOrder}] Generate image clicked. ID: ${scene.id}`);
      setIsImageGenerating(true);
      const base64 = await generateImage(imagePrompt, scene.id || undefined);
      setCachedImageUrl(base64);
      setIsImageGenerating(false);
      console.log(`[Scene ${scene.sceneOrder}] Success: Received image from API.`);
      
      if (onUpdateScene) {
        onUpdateScene({
          ...scene,
          image: { imageBase64: base64, mimeType: 'image/png' }
        });
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      setIsImageGenerating(false);
      alert("Failed to generate image");
    }
  };

  return (
    <Card className="group relative mb-6 overflow-hidden border border-border/50 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
      {/* Floating Controls */}
      <div className="absolute top-3 right-3 z-20 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-md hover:text-destructive transition-colors shadow-sm"
          onClick={() => scene.id && onDelete?.(scene.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-md hover:text-primary transition-colors shadow-sm"
          onClick={handleGenerateImage}
          disabled={isImageGenerating}
        >
          <RefreshCw className={cn("h-4 w-4", isImageGenerating && "animate-spin")} />
        </Button>
      </div>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* Left Column: Visual Container */}
          <div className="relative bg-muted/30 border-r border-border/50 overflow-hidden flex items-center justify-center min-h-[160px]">
            {(scene.image || cachedImageUrl) ? (
              <img 
                src={`data:image/png;base64,${cachedImageUrl || scene.image?.imageBase64}`} 
                alt={scene.visualDescription}
                className="w-full h-full object-cover aspect-video md:aspect-auto animate-in fade-in duration-500"
              />
            ) : (
              <div className="w-full aspect-video md:aspect-auto flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center ring-1 ring-primary/10 group-hover:scale-110 transition-transform duration-500">
                  {isImageGenerating ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-primary/40" />
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={isImageGenerating}
                  onClick={handleGenerateImage}
                  className="rounded-full border-primary/20 hover:bg-primary/5 text-primary text-[10px] h-7 px-3"
                >
                  {isImageGenerating ? 'Thinking...' : 'Generate Image'}
                </Button>
              </div>
            )}
            
            {/* Scene Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2 py-0.5 rounded-full bg-background/90 backdrop-blur text-[9px] font-black uppercase tracking-widest border border-border/50 text-foreground/70 shadow-sm">
                SCENE {scene.sceneOrder}
              </span>
            </div>
          </div>

          {/* Right Column: Work Area */}
          <div className="p-5 flex flex-col space-y-4 bg-gradient-to-br from-transparent to-muted/5">
            {/* Visual Description (Read-only) */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Visual Description</Label>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                {scene.visualDescription}
              </p>
            </div>

            {/* Script Editor */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Voiceover Script</Label>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight border transition-colors",
                    audioStatus === 'ready' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    audioStatus === 'processing' ? "bg-primary/10 text-primary border-primary/20" :
                    "bg-muted text-muted-foreground border-border"
                  )}>
                    {audioStatus === 'ready' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {audioStatus === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {audioStatus === 'uncached' && <Clock className="h-3 w-3 mr-1" />}
                    {audioStatus}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handlePlayAudio} 
                    disabled={isPlaying || isGenerating || !audioScript.trim()}
                    className={cn(
                      "h-8 px-3 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95",
                      isPlaying && "text-primary bg-primary/10"
                    )}
                  >
                    {isPlaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                  </Button>
                </div>
              </div>
              
              <TextareaAutosize
                value={audioScript}
                onChange={(e) => {
                  setAudioScript(e.target.value);
                  setCachedAudioUrl(null);
                }}
                minRows={2}
                className="w-full bg-transparent border-none p-0 text-sm leading-relaxed focus:ring-0 resize-none font-medium text-foreground/90 placeholder:text-muted-foreground/50 transition-all"
                placeholder="Enter narration text..."
              />
            </div>

            {/* AI Settings Section */}
            <Collapsible open={isPromptOpen} onOpenChange={setIsPromptOpen} className="group/coll border border-border/40 rounded-xl overflow-hidden bg-muted/20">
              <CollapsibleTrigger>
                <div className="w-full flex justify-between items-center px-4 py-2 h-auto text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all cursor-pointer">
                  <div className="flex items-center font-bold text-[9px] uppercase tracking-widest">
                    <Settings2 className="h-3.5 w-3.5 mr-2 text-primary/50 group-hover/coll:text-primary transition-colors" />
                    AI Generation Settings
                  </div>
                  {isPromptOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="pt-2 space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Image Prompt</Label>
                  <TextareaAutosize 
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    minRows={2}
                    className="w-full bg-background/50 border border-border/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed focus:ring-1 focus:ring-primary/30 resize-none transition-all shadow-inner"
                    placeholder="Visual generation instructions..."
                  />
                  <div className="flex justify-end pt-1">
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold uppercase tracking-widest text-primary hover:no-underline opacity-70 hover:opacity-100 italic">
                      Reset to AI Default
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


