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
    },
    onError: (error) => {
      console.error("Batch audio generation failed", error);
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
    }
  });

  const handleSceneVoiceChange = (sceneId: string, voice: string) => {
    setSceneVoices(prev => ({ ...prev, [sceneId]: voice }));
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background flex-1">
        <div className="max-w-md space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/10 text-secondary mb-6">
            <Volume2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter font-heading text-foreground">AUDIO EDITOR</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Please select a project from the storyboard to access the master script and audio controls.</p>
          <Button onClick={() => router.push('/')} className="rounded-full px-8 bg-secondary hover:bg-secondary/90 text-background font-bold h-12 shadow-xl shadow-secondary/20">
             Return to Storyboard
          </Button>
        </div>
      </div>
    );
  }

  const sortedScenes = [...(project?.scenes || [])].sort((a, b) => a.sceneOrder - b.sceneOrder);

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden font-sans">
      <TopBar 
        title={project?.title || "Loading..."} 
        onGenerateAudio={() => batchAudioMutation.mutate()}
        isGeneratingAudio={batchAudioMutation.isPending}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column - Voice Options (320px) */}
        <div className="w-[320px] flex flex-col border-r border-border bg-card/30 backdrop-blur-md transition-all duration-300">
          <div className="flex-1 overflow-y-auto pb-4 pt-8 px-8 custom-scrollbar">
            <div className="mb-10">
              <h1 className="text-3xl font-black flex items-center mb-1 italic tracking-tighter font-heading text-foreground">
                VOICE LAB
              </h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] font-heading">Neural Speech Engine</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary flex items-center font-heading">
                   <Volume2 className="w-3 h-3 mr-2" /> Global Narrator
                 </label>
                 {isLoadingVoices ? (
                   <div className="animate-pulse flex items-center h-12 bg-muted/50 rounded-xl px-4 border border-border">
                      <Loader2 className="w-4 h-4 animate-spin mr-3 text-muted-foreground"/> 
                      <span className="text-xs text-muted-foreground font-black uppercase tracking-widest font-heading">Loading...</span>
                   </div>
                 ) : (
                   <select 
                     value={globalVoice}
                     onChange={(e) => setGlobalVoice(e.target.value)}
                     className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:ring-2 focus:ring-secondary/30 outline-none transition-all cursor-pointer font-sans"
                   >
                     {voices.map((v: string) => (
                       <option key={v} value={v} className="bg-card">{v.replace('_', ' ').toUpperCase()}</option>
                     ))}
                   </select>
                 )}
              </div>

              <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:rotate-12 transition-transform">
                    <Volume2 className="h-10 w-10 text-secondary" />
                 </div>
                 <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 font-heading">Engine Info</h4>
                 <p className="text-[11px] font-semibold text-muted-foreground leading-relaxed font-sans">
                   Powered by Kokoro v1.0. <br/>High-fidelity neural speech synthesis optimized for storytelling.
                 </p>
              </div>
            </div>
          </div>

          <div className="mt-auto p-8 pt-6 border-t border-border">
            <Button 
              className="w-full h-16 text-sm font-black uppercase tracking-[0.1em] bg-secondary hover:bg-secondary/90 text-background rounded-2xl shadow-xl shadow-secondary/20 transition-all active:scale-[0.98] font-heading group"
              onClick={() => batchAudioMutation.mutate()}
              disabled={batchAudioMutation.isPending || !project?.scenes?.length || isLoadingVoices}
            >
              {batchAudioMutation.isPending ? (
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" /> SYNTHESIZING...
                </div>
              ) : (
                <div className="flex items-center">
                  RENDER ALL SCRIPT <Wand2 className="ml-3 h-4 w-4 group-hover:rotate-12 transition-transform" />
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column - Script Preview (Flexible) */}
        <div className="flex-1 bg-background/50 flex flex-col relative min-h-0">
           {/* Background Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />

           <div className="flex-1 w-full relative z-10 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8 px-12 py-12 pb-24">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground font-heading mb-1">Production Script</h2>
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest font-heading">Final broadcast version review</p>
                </div>
                <div className="text-[10px] font-black text-foreground bg-muted rounded-md px-4 py-2 border border-border shadow-sm font-heading">
                    {project?.scenes?.length || 0} SECTIONS TOTAL
                </div>
              </div>
              
              {isLoadingProject ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 w-full rounded-3xl bg-muted/20 border border-border animate-pulse" />
                  ))}
                </div>
              ) : project?.scenes && project.scenes.length > 0 ? (
                sortedScenes.map((scene: Scene, i: number) => {
                  const currentVoice = sceneVoices[scene.id!] || globalVoice;
                  // @ts-ignore - added to model
                  const cachedVoice = scene.audio?.voice;
                  const isProcessing = generateSingleAudioMutation.isPending && 
                                      generateSingleAudioMutation.variables?.sceneId === scene.id;

                  return (
                    <div key={scene.id || i} className="overflow-hidden bg-card/40 backdrop-blur-md border border-border shadow-md hover:shadow-xl hover:border-secondary/30 transition-all rounded-3xl group">
                      <div className="p-5 border-b border-border bg-background/40 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-heading">SECTION {scene.sceneOrder}</span>
                          {cachedVoice && (
                            <div className="px-2.5 py-1 bg-secondary text-background text-[9px] font-black rounded-md tracking-tighter font-heading">
                              {cachedVoice.toUpperCase()}
                            </div>
                          )}
                        </div>
                        {scene.audio ? (
                           <div className="flex items-center space-x-2 text-secondary font-black text-[9px] uppercase tracking-widest font-heading">
                             <div className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
                             <span>SYNCED</span>
                           </div>
                        ) : (
                           <div className="flex items-center space-x-2 text-muted-foreground font-black text-[9px] uppercase tracking-widest font-heading">
                             <div className="h-1.5 w-1.5 rounded-full bg-muted border border-border" />
                             <span>PENDING</span>
                           </div>
                        )}
                      </div>
                      <div className="p-8">
                        <div className="bg-background/20 p-6 rounded-2xl border border-border/50 text-xl font-medium leading-relaxed italic text-foreground/90 font-sans mb-8">
                          "{scene.audioScript}"
                        </div>
                        
                        <div className="flex items-center gap-4">
                           <div className="flex-1 h-12 flex items-center bg-background border border-border rounded-xl px-5 transition-all focus-within:ring-2 focus-within:ring-secondary/20">
                             <span className="text-[10px] font-black text-muted-foreground tracking-[0.2em] mr-6 font-heading">VOICE</span>
                             <select 
                                value={currentVoice}
                                onChange={(e) => handleSceneVoiceChange(scene.id!, e.target.value)}
                                className="bg-transparent text-xs font-black text-foreground focus:ring-0 outline-none cursor-pointer flex-1 font-heading"
                              >
                                {voices.map((v: string) => (
                                  <option key={v} value={v} className="bg-card">{v.replace('_', ' ').toUpperCase()}</option>
                                ))}
                              </select>
                           </div>

                          <Button 
                            className="h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-muted hover:bg-muted/80 text-foreground border border-border shadow-sm active:scale-95 transition-all font-heading"
                            onClick={() => generateSingleAudioMutation.mutate({ 
                              sceneId: scene.id!, 
                              text: scene.audioScript, 
                              voice: currentVoice 
                              //@ts-ignore
                            })}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : "REGENERATE"}
                          </Button>
                        </div>

                        {scene.audio?.audioBase64 && (
                          <div className="mt-8 pt-6 border-t border-border flex flex-col gap-4">
                            <audio className="w-full h-10 outline-none cinematic-audio-player" controls src={`data:audio/wav;base64,${scene.audio.audioBase64}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center mt-32 text-muted-foreground/20">
                  <AlignLeft className="h-20 w-20 mb-6" />
                  <p className="font-black uppercase tracking-[0.3em] text-[10px] font-heading">No script sections found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AudioPage() {
  return (
    <Suspense fallback={<div className="flex w-full h-full items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <AudioContent />
    </Suspense>
  );
}
