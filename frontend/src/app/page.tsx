"use client";

import { useState, useEffect, Suspense } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, PanelLeftClose, PanelLeftOpen, Film, Image as ImageIcon } from "lucide-react";
import { SceneCard } from "@/components/SceneCard";
import { TopBar } from "@/components/layout/TopBar";
import { ProductionSetupModal } from "@/components/ProductionSetupModal";
import { generateStoryboard, generateAllAudio, generateAllImages, generateAllAssets, getProject, Project, Scene, downloadVideo } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function StoryboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('id');

  const [storyInput, setStoryInput] = useState("");
  const [visualStyle, setVisualStyle] = useState("Cinematic, photorealistic, 8k, highly detailed");
  const [project, setProject] = useState<Project | null>(null);
  const [imageModel, setImageModel] = useState<string>("FLUX");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // Load existing project if 'id' is in URL
  const { data: loadedProject, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId as string),
    enabled: !!projectId,
    refetchInterval: (query) => {
      // If any scene is missing audio or image, refetch every 5s
      const data = query.state.data as Project;
      if (!data) return false;
      const isPending = data.scenes.some(s => !s.audio || !s.image);
      return isPending ? 5000 : false;
    }
  });

  useEffect(() => {
    if (loadedProject) {
      setProject(loadedProject);
      setStoryInput(loadedProject.originalStory || "");
      if (loadedProject.scenes && loadedProject.scenes.length > 0) {
        setIsSidebarOpen(false);
        if (!selectedSceneId) {
          setSelectedSceneId(loadedProject.scenes.sort((a,b) => a.sceneOrder - b.sceneOrder)[0].id || null);
        }
      }
    }
  }, [loadedProject]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setStoryInput("");
      setIsSidebarOpen(true);
      setSelectedSceneId(null);
    }
  }, [projectId]);

  const sortedScenes = [...(project?.scenes || [])].sort((a, b) => a.sceneOrder - b.sceneOrder);
  const activeScene = sortedScenes.find(s => s.id === selectedSceneId) || sortedScenes[0];
  const activeSceneIndex = sortedScenes.findIndex(s => s.id === selectedSceneId);

  const mutation = useMutation({
    mutationFn: ({ story, style }: { story: string, style: string }) => generateStoryboard(story, style),
    onSuccess: (data) => {
      setProject(data);
      setIsSidebarOpen(false);
      setSelectedSceneId(data.scenes[0]?.id || null);
      router.push(`/?id=${data.id}`);
      setIsSetupModalOpen(true);
    },
    onError: (error) => {
      console.error("Storyboard generation failed", error);
      alert("Failed to generate storyboard. Please try again.");
    }
  });

  const fullProductionMutation = useMutation({
    mutationFn: ({ id, voice, model }: { id: string, voice: string, model: string }) => 
      generateAllAssets(id, voice, model),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error) => {
      console.error("Full production failed", error);
      alert("Failed during production. Check server logs.");
    }
  });

  const batchAudioMutation = useMutation({
    mutationFn: (id: string) => generateAllAudio(id, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    }
  });

  const batchVisualsMutation = useMutation({
    mutationFn: (id: string) => generateAllImages(id, imageModel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    }
  });

  const downloadVideoMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await downloadVideo(projectId, `${project?.title || 'video'}.mp4`);
    }
  });

  const handleGenerate = () => {
    if (!storyInput.trim()) return;
    mutation.mutate({ story: storyInput, style: visualStyle });
  };

  const handleStartProduction = (voice: string, model: string) => {
    if (project?.id) {
      setImageModel(model);
      setIsSetupModalOpen(false);
      fullProductionMutation.mutate({ id: project.id, voice, model });
    }
  };

  const projectTitle = project?.title || "New Project";

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <TopBar 
        title={projectTitle} 
        onGenerateAudio={() => project?.id && batchAudioMutation.mutate(project.id)}
        onGenerateVisuals={() => project?.id && batchVisualsMutation.mutate(project.id)}
        onDownloadVideo={() => project?.id && downloadVideoMutation.mutate(project.id)}
        isGeneratingAudio={batchAudioMutation.isPending || fullProductionMutation.isPending}
        isGeneratingVisuals={batchVisualsMutation.isPending || fullProductionMutation.isPending}
        isDownloading={downloadVideoMutation.isPending}
      />

      <ProductionSetupModal 
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onStartProduction={handleStartProduction}
        currentImageModel={imageModel}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: SCRIPT EXPLORER */}
        <div className={cn(
          "w-80 border-r border-border bg-card/30 backdrop-blur-md flex flex-col transition-all duration-300",
          !project ? "opacity-0 invisible w-0" : "opacity-100 visible"
        )}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-heading">Storyboard Scenes</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsSidebarOpen(true)}>
              <Wand2 className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {sortedScenes.map((scene, idx) => {
              const isActive = selectedSceneId === scene.id;
              return (
                <div 
                  key={scene.id}
                  onClick={() => setSelectedSceneId(scene.id || null)}
                  className={cn(
                    "p-4 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden",
                    isActive 
                      ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20 shadow-xl shadow-primary/5" 
                      : "border-border/50 hover:bg-white/[0.03] text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "text-[9px] font-black px-2.5 py-1 rounded-md tracking-[0.15em] font-heading",
                      isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                      SCENE {scene.sceneOrder}
                    </span>
                    <div className="flex gap-1.5">
                       {scene.image && <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                       {scene.audio && <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
                    </div>
                  </div>
                  <p className={cn(
                    "text-xs leading-relaxed font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                  )}>
                    {scene.audioScript.length > 80 ? scene.audioScript.substring(0, 80) + "..." : scene.audioScript}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: LIVE CANVAS / STAGE */}
        <div className="flex-1 flex flex-col relative bg-background/50">
          {(!project || isLoadingProject) ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="max-w-md space-y-6">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6 animate-pulse">
                  <Film className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter font-heading text-foreground">CREATE YOUR STORY</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">Paste your script or story ideas in the magic box to begin your AI production journey.</p>
                <div className="pt-4 flex justify-center">
                   {!isSidebarOpen && (
                     <Button 
                       onClick={() => setIsSidebarOpen(true)}
                       className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-2xl shadow-primary/20 transition-all active:scale-95"
                     >
                       <Wand2 className="h-4 w-4 mr-2" /> Start New Project
                     </Button>
                   )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
               
               <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-border shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black relative group">
                  {activeScene?.image?.imageBase64 ? (
                    <img 
                      src={`data:image/png;base64,${activeScene.image.imageBase64}`}
                      className="w-full h-full object-contain fade-in"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                      <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40 font-heading">Awaiting Visual Render</p>
                    </div>
                  )}
                  
                  {/* Floating Scene Indicator */}
                  <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 font-heading">
                    Scene {activeScene?.sceneOrder}
                  </div>
               </div>
            </div>
          )}

          {/* Bottom Tool Bar (Subtle) */}
          {project && (
            <div className="h-16 border-t border-border bg-card/30 backdrop-blur-sm flex items-center justify-between px-8">
              <div className="flex items-center gap-4">
                 <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-black italic text-foreground border border-border">
                   {project.scenes.length}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-heading">Total Scenes</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center h-8 bg-muted rounded-full px-4 border border-border">
                    <span className="text-[10px] uppercase font-black text-muted-foreground mr-2 font-heading">Engine:</span>
                    <span className="text-[10px] font-black text-primary font-heading">FLUX.1</span>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INSPECTOR / EDITOR */}
        {project && activeScene && (
          <div className="w-[400px] border-l border-border bg-card/30 backdrop-blur-md flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-8">
               <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary flex items-center font-heading">
                    <PanelLeftOpen className="h-3 w-3 mr-2" /> Script Editor
                  </span>
                  <SceneCard 
                    key={activeScene.id}
                    scene={activeScene}
                    imageModel={imageModel}
                    onUpdateScene={(updated) => {
                      queryClient.setQueryData(['project', projectId], (old: Project | undefined) => {
                        if (!old) return old;
                        return {
                          ...old,
                          scenes: old.scenes.map(s => s.id === updated.id ? updated : s)
                        };
                      });
                    }}
                  />
               </div>
            </div>
          </div>
        )}

        {/* OVERLAY: MAGIC INPUT SIDEBAR */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transition-all duration-700 ease-in-out bg-background/90 backdrop-blur-[32px] border-r border-border shadow-2xl",
          isSidebarOpen ? "w-[450px] translate-x-0" : "w-[450px] -translate-x-full"
        )}>
          <div className="h-full flex flex-col p-10">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter text-foreground font-heading">MAGIC BOX</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 font-heading">From script to screen in seconds</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-10 w-10 rounded-full bg-muted border border-border hover:bg-muted/80">
                 <PanelLeftClose className="h-5 w-5" />
              </Button>
            </div>
            
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 space-y-8 flex flex-col">
            <div className="flex flex-col space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 font-heading">Input Story or Script</label>
              <Textarea
                className="min-h-[350px] resize-none text-base leading-relaxed p-6 border-border bg-black/40 rounded-3xl focus:ring-primary/20 transition-all font-sans text-foreground placeholder:text-muted-foreground/30"
                placeholder="Paste your story here. The AI will segment it into scenes..."
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>

            <div className="flex flex-col space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 font-heading">Universal Visual Style</label>
              <div className="relative">
                <div className="absolute left-4 top-4 text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <Textarea
                  className="h-28 resize-none pl-12 pt-4 bg-black/40 border-border rounded-2xl text-sm italic font-sans text-foreground"
                  placeholder="E.g., Cinematic, photorealistic, neon vibe..."
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                  disabled={mutation.isPending}
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 mt-auto">
            <Button 
              className="w-full h-16 text-lg font-black italic tracking-tight bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all group font-heading"
              onClick={handleGenerate}
              disabled={mutation.isPending || !storyInput.trim()}
            >
              {mutation.isPending ? (
                <div className="flex items-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-3" /> ANALYZING SCRIPT...
                </div>
              ) : (
                <div className="flex items-center">
                  RENDER STORYBOARD <Wand2 className="ml-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
                </div>
              )}
            </Button>
            {project && (
               <Button 
                 variant="ghost" 
                 className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                 onClick={() => setIsSidebarOpen(false)}
                 disabled={mutation.isPending}
               >
                 GO BACK TO EDITOR
               </Button>
            )}
          </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function StoryboardView() {
  return (
    <Suspense fallback={
      <div className="flex w-full h-full min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    }>
      <StoryboardContent />
    </Suspense>
  );
}
