"use client";

import { useState, useEffect, Suspense } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2, Loader2, Wand2, Plus, AlignLeft } from "lucide-react";
import { getProject, Project, Scene, getVoices, generateAllAudio, generateAudio, generateAllImages, generateAllAssets } from "@/lib/api";
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
  const [imageModel, setImageModel] = useState<string>("SDXL TURBO");
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

  const batchVisualsMutation = useMutation({
    mutationFn: () => generateAllImages(projectId as string, imageModel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      alert("Batch visuals generation complete!");
    },
    onError: (error) => {
      console.error("Batch visuals generation failed", error);
      alert("Failed to generate visuals.");
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
      <TopBar 
        title={project?.title || "Loading..."} 
        onGenerateAudio={() => batchAudioMutation.mutate()}
        onGenerateVisuals={() => batchVisualsMutation.mutate()}
        isGeneratingAudio={batchAudioMutation.isPending}
        isGeneratingVisuals={batchVisualsMutation.isPending}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Voice Options (30%) */}
        <div className="w-full md:w-[30%] flex flex-col border-r border-slate-800 bg-slate-950/60 backdrop-blur-xl pb-4 pt-6 px-6 shadow-xl overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-xl font-black flex items-center mb-2 italic tracking-tight">
              <Volume2 className="w-5 h-5 mr-3 text-primary" /> NARRATOR
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global project narration settings</p>
          </div>

          <div className="space-y-4 mb-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Default Voice</h3>
            {isLoadingVoices ? (
              <div className="animate-pulse flex items-center space-x-2 text-xs text-slate-600 font-bold"><Loader2 className="w-4 h-4 animate-spin"/> Loading library...</div>
            ) : (
              <select 
                value={globalVoice}
                onChange={(e) => setGlobalVoice(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-800 bg-slate-900/50 text-sm font-bold text-slate-200 focus:ring-1 focus:ring-primary/50 outline-none transition-all cursor-pointer"
              >
                {voices.map((v) => (
                  <option key={v} value={v} className="bg-slate-900">{v.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2 mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Visual Model</h3>
            <select 
              value={imageModel}
              onChange={(e) => setImageModel(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-800 bg-slate-900/50 text-sm font-bold text-slate-200 focus:ring-1 focus:ring-primary/50 outline-none transition-all cursor-pointer"
            >
              <option value="SDXL TURBO" className="bg-slate-900">SDXL TURBO (Fast)</option>
              <option value="SDXL" className="bg-slate-900">SDXL (High Res)</option>
              <option value="FLUX" className="bg-slate-900">FLUX (Ultra Detailed)</option>
            </select>
          </div>

          <Button 
            className="w-full h-14 text-sm font-black uppercase tracking-[0.1em] bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-95"
            onClick={() => batchAudioMutation.mutate()}
            disabled={batchAudioMutation.isPending || !project?.scenes?.length || isLoadingVoices}
          >
            {batchAudioMutation.isPending ? (
              <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Rendering All...</>
            ) : (
              <><Wand2 className="w-5 h-5 mr-3" /> Batch Render All</>
            )}
          </Button>
          
          <p className="mt-6 text-[10px] text-slate-600 font-bold text-center leading-relaxed max-w-[200px] mx-auto">
            Powered by Kokoro v1.0. <br/>High-fidelity neural speech synthesis.
          </p>
        </div>

        {/* Right Column - Script Preview (70%) */}
        <div className="w-full md:w-[70%] bg-slate-900/30 flex flex-col h-full shadow-inner">
           <ScrollArea className="flex-1 w-full px-8 py-8 pb-24 h-[calc(100vh-4rem)]">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Master Script Review</h2>
                <div className="text-[10px] font-bold text-slate-600 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                    {project?.scenes?.length || 0} SECTIONS TOTAL
                </div>
              </div>
              
              {isLoadingProject ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="mb-4 bg-slate-900/50 border-slate-800 animate-pulse"><CardContent className="p-6"><Skeleton className="h-6 w-3/4 mb-4 bg-slate-800"/><Skeleton className="h-12 w-full bg-slate-800"/></CardContent></Card>
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
                    <Card key={scene.id || i} className="overflow-hidden bg-slate-900/60 backdrop-blur border-slate-800 shadow-xl hover:shadow-2xl hover:border-slate-700 transition-all rounded-2xl group">
                      <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-500">SECTION {scene.sceneOrder}</span>
                          {cachedVoice && (
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-slate-700 text-slate-400 font-bold tracking-tight">
                              {cachedVoice.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        {scene.audio ? (
                           <div className="flex items-center space-x-2 text-blue-400 font-bold">
                             <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                             <span>SYNCED</span>
                           </div>
                        ) : (
                           <div className="flex items-center space-x-2 text-slate-600 font-bold">
                             <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                             <span>PENDING</span>
                           </div>
                        )}
                      </div>
                      <CardContent className="p-6">
                        <p className="text-lg font-medium leading-relaxed bg-slate-950/30 p-5 rounded-2xl text-slate-200 border border-slate-800/50 italic mb-6">
                          "{scene.audioScript}"
                        </p>
                        
                        <div className="flex items-center space-x-4">
                           <div className="flex-1 h-11 flex items-center bg-slate-950/50 rounded-xl px-4 border border-slate-800">
                             <span className="text-[10px] font-black text-slate-600 tracking-wider mr-4">VOICE:</span>
                             <select 
                                value={currentVoice}
                                onChange={(e) => handleSceneVoiceChange(scene.id!, e.target.value)}
                                className="bg-transparent text-xs font-bold text-primary focus:ring-0 outline-none cursor-pointer flex-1"
                              >
                                {voices.map((v) => (
                                  <option key={v} value={v} className="bg-slate-900">{v.replace('_', ' ').toUpperCase()}</option>
                                ))}
                              </select>
                           </div>

                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            onClick={() => generateSingleAudioMutation.mutate({ 
                              sceneId: scene.id!, 
                              text: scene.audioScript, 
                              voice: currentVoice 
                            })}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : "REGENERATE"}
                          </Button>
                        </div>

                        {scene.audio?.audioBase64 && (
                          <div className="mt-6 pt-6 border-t border-slate-800">
                            <audio className="w-full h-10 outline-none opacity-50 hover:opacity-100 transition-opacity" controls src={`data:audio/wav;base64,${scene.audio.audioBase64}`} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center mt-32 text-slate-600">
                  <AlignLeft className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">No script sections found</p>
                </div>
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
