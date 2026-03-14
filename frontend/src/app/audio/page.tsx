"use client";

import { useState, useEffect, Suspense } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2, Loader2, Wand2, Plus, AlignLeft } from "lucide-react";
import { getProject, Project, Scene, getVoices, generateAllAudio, generateAudio } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";

function AudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('id');

  const [project, setProject] = useState<Project | null>(null);
  const [globalVoice, setGlobalVoice] = useState<string>("af_bella");
  const [sceneVoices, setSceneVoices] = useState<Record<string, string>>({});

  const { data: loadedProject, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId as string),
    enabled: !!projectId,
  });

  const { data: voices = [], isLoading: isLoadingVoices } = useQuery({
    queryKey: ['voices'],
    queryFn: getVoices,
  });

  useEffect(() => {
    if (loadedProject) setProject(loadedProject);
  }, [loadedProject]);

  const batchAudioMutation = useMutation({
    mutationFn: () => generateAllAudio(projectId as string, globalVoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      alert("Batch audio generation complete!");
    },
    onError: (error) => {
      console.error("Batch audio generation failed", error);
      alert("Failed to generate audio.");
    }
  });

  const generateSingleAudioMutation = useMutation({
    mutationFn: ({ sceneId, text, voice }: { sceneId: string, text: string, voice: string }) => 
      generateAudio(text, voice, sceneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error) => {
      console.error("Single audio generation failed", error);
      alert("Failed to generate audio for this scene.");
    }
  });

  const handleSceneVoiceChange = (sceneId: string, voice: string) => {
    setSceneVoices(prev => ({ ...prev, [sceneId]: voice }));
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background flex-1">
        <h3 className="text-xl font-semibold mb-2">No Project Selected</h3>
        <p className="text-muted-foreground mb-4">Please select a project from the sidebar to generate audio.</p>
        <Button onClick={() => router.push('/')}>Go to Storyboard</Button>
      </div>
    );
  }

  const sortedScenes = [...(project?.scenes || [])].sort((a, b) => a.sceneOrder - b.sceneOrder);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden flex-1 w-full">
      <TopBar title={project?.title || "Loading..."} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Voice Options (30%) */}
        <div className="w-full md:w-[30%] flex flex-col border-r bg-card/50 backdrop-blur pb-4 pt-6 px-6 shadow-sm overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-xl font-bold flex items-center mb-2">
              <Volume2 className="w-5 h-5 mr-2 text-primary" /> Note Narrator
            </h1>
            <p className="text-sm text-muted-foreground">Select a voice to narrate this storyboard.</p>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-sm">Default Project Voice</h3>
            {isLoadingVoices ? (
              <div className="animate-pulse flex items-center space-x-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin"/> Loading voices...</div>
            ) : (
              <select 
                value={globalVoice}
                onChange={(e) => setGlobalVoice(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                {voices.map((v) => (
                  <option key={v} value={v}>{v.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            )}
          </div>

          <Button 
            className="w-full h-12 text-base font-semibold bg-primary"
            onClick={() => batchAudioMutation.mutate()}
            disabled={batchAudioMutation.isPending || !project?.scenes?.length || isLoadingVoices}
          >
            {batchAudioMutation.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Rendering All...</>
            ) : (
              <><Wand2 className="w-5 h-5 mr-2" /> Batch Generate Audio</>
            )}
          </Button>
          
          <p className="mt-4 text-xs text-muted-foreground text-center">
            This will fetch lifelike speech from the Kokoro TTS engine.
          </p>
        </div>

        {/* Right Column - Script Preview (70%) */}
        <div className="w-full md:w-[70%] bg-muted/20 flex flex-col h-full">
           <ScrollArea className="flex-1 w-full px-6 py-6 pb-24 h-[calc(100vh-4rem)]">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-lg font-semibold mb-6 text-foreground/80">Project Script Review</h2>
              {isLoadingProject ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="mb-4 shadow-sm opacity-80"><CardContent className="p-4"><Skeleton className="h-6 w-3/4 mb-2"/><Skeleton className="h-4 w-full"/></CardContent></Card>
                  ))}
                </>
              ) : project?.scenes && project.scenes.length > 0 ? (
                sortedScenes.map((scene: Scene, i: number) => {
                  const currentVoice = sceneVoices[scene.id!] || globalVoice;
                  // @ts-ignore - voice is added to model now
                  const cachedVoice = scene.audio?.voice;
                  const isProcessing = generateSingleAudioMutation.isPending && 
                                      generateSingleAudioMutation.variables?.sceneId === scene.id;

                  return (
                    <Card key={scene.id || i} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-3 bg-muted/30 border-b flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <span>Scene {scene.sceneOrder}</span>
                          {cachedVoice && (
                            <Badge variant="outline" className="text-[10px] py-0 h-4 normal-case font-medium">
                              {cachedVoice}
                            </Badge>
                          )}
                        </div>
                        {scene.audio ? <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">Audio Ready</span> : <span className="text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">No Audio</span>}
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm font-mono leading-relaxed bg-muted/20 p-4 rounded-lg italic mb-4">
                          "{scene.audioScript}"
                        </p>
                        
                        <div className="flex items-center space-x-3 mb-4">
                          <select 
                            value={currentVoice}
                            onChange={(e) => handleSceneVoiceChange(scene.id!, e.target.value)}
                            className="h-8 px-2 rounded-md border border-input bg-background text-xs font-medium focus:ring-1 focus:ring-primary w-40"
                          >
                            {voices.map((v) => (
                              <option key={v} value={v}>{v.replace('_', ' ').toUpperCase()}</option>
                            ))}
                          </select>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 text-[11px] font-bold"
                            onClick={() => generateSingleAudioMutation.mutate({ 
                              sceneId: scene.id!, 
                              text: scene.audioScript, 
                              voice: currentVoice 
                            })}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : "REGENERATE"}
                          </Button>
                        </div>

                        {scene.audio?.audioBase64 && (
                          <div className="pt-4 border-t">
                            <audio className="w-full h-8 outline-none grayscale" controls src={`data:audio/wav;base64,${scene.audio.audioBase64}`} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="flex justify-center mt-20 text-muted-foreground italic text-sm">No scenes to display.</div>
              )}
            </div>
           </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default function AudioPage() {
  return (
    <Suspense fallback={<div className="flex w-full h-full items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>}>
      <AudioContent />
    </Suspense>
  );
}
