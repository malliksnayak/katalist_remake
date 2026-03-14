"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Play, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { Scene, generateAudio } from "@/lib/api";

interface SceneCardProps {
  scene: Scene;
  onUpdateScene?: (updatedScene: Scene) => void;
}

export function SceneCard({ scene, onUpdateScene }: SceneCardProps) {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [audioScript, setAudioScript] = useState(scene.audioScript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);

  const handlePlayAudio = async () => {
    try {
      setIsPlaying(true);
      console.log(`[Scene ${scene.sceneOrder}] Play clicked. ID: ${scene.id}`);
      
      let audioData = scene.audio?.audioBase64;
      
      if (audioData) {
        console.log(`[Scene ${scene.sceneOrder}] Success: Found audio in scene object (fetched from DB).`);
      } else if (cachedAudioUrl) {
        console.log(`[Scene ${scene.sceneOrder}] Info: Audio not in scene object, but found in session cache.`);
        audioData = cachedAudioUrl;
      } else {
        console.log(`[Scene ${scene.sceneOrder}] Info: No existing audio found. Calling API to check/generate...`);
        // scene.id is a UUID string now
        const base64 = await generateAudio(audioScript, 'af_bella', scene.id);
        audioData = base64;
        setCachedAudioUrl(base64);
        console.log(`[Scene ${scene.sceneOrder}] Success: Received audio from API.`);
      }

      if (!audioData) throw new Error("Audio data is empty");
      
      // Ensure it's a valid Data URL for audio playback
      const dataUrl = audioData.startsWith('data:') 
        ? audioData 
        : `data:audio/wav;base64,${audioData}`;
      
      const audioObject = new window.Audio(dataUrl);
      
      audioObject.onended = () => {
        setIsPlaying(false);
      };
      
      await audioObject.play();
    } catch (error) {
      console.error("Failed to play audio:", error);
      setIsPlaying(false);
      alert("Failed to generate and play audio");
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md">
      <CardHeader className="bg-muted/50 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Scene {scene.sceneOrder}</CardTitle>
            <CardDescription>{scene.durationSeconds} seconds</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => {}}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Image
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-t">
          {/* Visual Section */}
          <div className="w-full md:w-5/12 p-4 bg-muted/10 flex flex-col">
            <Label className="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Visual</Label>
            <div className="flex-1 bg-muted rounded-md border border-dashed border-border flex items-center justify-center min-h-[200px] my-2 group relative overflow-hidden">
              <ImageIcon className="h-10 w-10 text-muted-foreground opacity-50 absolute" />
              <div className="z-10 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                DALL-E Integration Pending
              </div>
            </div>
            <p className="text-sm text-foreground my-2">{scene.visualDescription}</p>
          </div>

          {/* Audio & Settings Section */}
          <div className="w-full md:w-7/12 p-4 flex flex-col">
            <div className="flex-1 flex flex-col mb-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Voiceover Script</Label>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handlePlayAudio} 
                  disabled={isPlaying || !audioScript.trim()}
                  className="h-8"
                >
                  <Play className={`h-3.5 w-3.5 mr-1.5 ${isPlaying ? 'animate-pulse text-green-500' : ''}`} />
                  {isPlaying ? 'Playing...' : 'Play Audio'}
                </Button>
              </div>
              <Textarea 
                value={audioScript}
                onChange={(e) => {
                  setAudioScript(e.target.value);
                  setCachedAudioUrl(null);
                }}
                className="flex-1 min-h-[140px] resize-none"
                placeholder="Enter narration text..."
              />
            </div>

            <Collapsible open={isPromptOpen} onOpenChange={setIsPromptOpen} className="border rounded-md mt-auto">
              <CollapsibleTrigger className="w-full flex justify-between items-center p-3 h-auto hover:bg-accent hover:text-accent-foreground rounded-t-md text-left cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                <span className="text-sm font-medium">Image Generation Prompt</span>
                {isPromptOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 pt-0">
                <Textarea 
                  defaultValue={scene.imagePrompt}
                  className="min-h-[100px] text-sm mt-2"
                  placeholder="The prompt that will be sent to the image generator..."
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
