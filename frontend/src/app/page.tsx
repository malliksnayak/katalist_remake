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
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  // Load existing project if 'id' is in URL
  const { data: loadedProject, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId as string),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (loadedProject) {
      setProject(loadedProject);
      setStoryInput(loadedProject.originalStory || "");
      if (loadedProject.scenes && loadedProject.scenes.length > 0) {
        setIsSidebarOpen(false);
      }
    }
  }, [loadedProject]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setStoryInput("");
      setIsSidebarOpen(true);
      setActiveSceneIndex(0);
    }
  }, [projectId]);

  const mutation = useMutation({
    mutationFn: ({ story, style }: { story: string, style: string }) => generateStoryboard(story, style),
    onSuccess: (data) => {
      setProject(data);
      setIsSidebarOpen(false);
      setActiveSceneIndex(0);
      router.push(`/?id=${data.id}`);
      // PROMPT USER FOR PRODUCTION SETTINGS
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
      alert("Full production completed successfully!");
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
    },
    onError: (error) => {
      console.error("Batch audio generation failed", error);
      alert("Failed to generate all audio. Check server logs.");
    }
  });

  const batchVisualsMutation = useMutation({
    mutationFn: (id: string) => generateAllImages(id, imageModel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error) => {
      console.error("Batch visuals generation failed", error);
      alert("Failed to generate all visuals. Check server logs.");
    }
  });

  const downloadVideoMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await downloadVideo(projectId, `${project?.title || 'video'}.mp4`);
    },
    onError: (error) => {
      console.error("Video download failed", error);
      alert("Failed to initiate video download.");
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

  const handleGenerateAudio = () => {
    if (project?.id) {
      batchAudioMutation.mutate(project.id);
    }
  };

  const handleGenerateVisuals = () => {
    if (project?.id) {
      batchVisualsMutation.mutate(project.id);
    }
  };

  const handleDownloadVideo = () => {
    if (project?.id) {
      downloadVideoMutation.mutate(project.id);
    }
  };

  const projectTitle = project?.title || "New Project";
  const sortedScenes = [...(project?.scenes || [])].sort((a, b) => a.sceneOrder - b.sceneOrder);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      <TopBar 
        title={projectTitle} 
        onGenerateAudio={handleGenerateAudio}
        onGenerateVisuals={handleGenerateVisuals}
        onDownloadVideo={handleDownloadVideo}
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
      
      <div className="flex-1 flex overflow-hidden isolate shadow-inner">
        {/* Collapsible Sidebar (Story Input) */}
        <div className={cn(
          "flex flex-col border-r bg-card/60 backdrop-blur pb-4 pt-4 relative z-20 shadow-xl transition-all duration-500 ease-in-out shrink-0 overflow-hidden",
          isSidebarOpen ? "w-full md:w-[400px] px-6" : "w-0 px-0 opacity-0 border-none"
        )}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 whitespace-nowrap">Story Input</h1>
              <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">Paste text to generate storyboard.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-8 w-8 rounded-full">
               <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          
          <div className="flex-1 min-h-0 flex flex-col relative group">
            <Textarea
              className="resize-none flex-1 font-mono text-sm leading-relaxed p-4 border shadow-inner transition-all focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl bg-background/50"
              placeholder="E.g., Once upon a time in a futuristic city..."
              value={storyInput}
              onChange={(e) => setStoryInput(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="mt-4 flex flex-col space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Visual Style & Tweaks</label>
            <Textarea
              className="h-20 resize-none font-sans text-sm p-3 border shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl bg-background/30"
              placeholder="E.g., Cinematic, photorealistic, dark atmosphere, neon lighting..."
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value)}
              disabled={mutation.isPending}
            />
            <p className="text-[10px] text-muted-foreground italic px-1">Describe the look and feel you want for all scenes.</p>
          </div>
          
          <Button 
            className="mt-6 h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            onClick={handleGenerate}
            disabled={mutation.isPending || !storyInput.trim()}
          >
            {mutation.isPending ? (
              <span className="flex items-center space-x-2 animate-pulse">
                <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Storyboard
              </span>
            )}
          </Button>
        </div>

        {/* Right Column - Focus Scene Canvas (Dark Mode Theme) */}
        <div className="flex-1 flex flex-col relative z-0 h-full bg-slate-950 text-slate-100 overflow-hidden">
          
          {/* Top Controls Float */}
          <div className="absolute top-4 left-4 z-30 flex items-center space-x-3">
            {!isSidebarOpen && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsSidebarOpen(true)} 
                className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300 rounded-full shadow-lg"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}
            
            {project?.scenes && project.scenes.length > 0 && (
              <div className="h-9 flex items-center bg-slate-900/80 backdrop-blur-md rounded-full px-4 border border-slate-700/50 shadow-lg">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mr-2">Model:</span>
                <select 
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer text-primary focus:ring-0 [&>option]:bg-slate-900 [&>option]:text-slate-100"
                >
                  <option value="FLUX">FLUX</option>
                </select>
              </div>
            )}
          </div>

          <div className="text-sm absolute top-4 right-6 z-30 font-medium font-mono text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-md">
            {project?.scenes ? `${activeSceneIndex + 1} / ${project.scenes.length} Scenes` : 'Ready to Generate'}
          </div>

          {/* Main Canvas Area */}
          <div className={cn(
            "flex-1 flex items-center justify-center p-6 overflow-hidden relative transition-all duration-500",
            project?.scenes?.length ? "pb-40" : "" // leave space for filmstrip
          )}>
            {mutation.isPending || isLoadingProject ? (
               <div className="flex flex-col items-center space-y-4">
                 <Loader2 className="h-12 w-12 text-primary animate-spin" />
                 <p className="text-slate-400 font-medium animate-pulse">Crafting your storyboard...</p>
               </div>
            ) : project?.scenes && project.scenes.length > 0 && sortedScenes[activeSceneIndex] ? (
              <div className="w-full max-w-5xl max-h-full overflow-y-auto pr-2 custom-scrollbar fade-in animate-in slide-in-from-bottom-4 duration-500">
                <SceneCard 
                  scene={sortedScenes[activeSceneIndex]} 
                  imageModel={imageModel} 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-center text-slate-500 opacity-70 fade-in animate-in duration-1000">
                <Film className="h-20 w-20 mx-auto mb-6 text-slate-700" />
                <h3 className="text-xl font-medium text-slate-300">No Scenes Yet</h3>
                <p className="mt-2 text-sm max-w-sm">Open the sidebar to script your story and hit generate to visualize it here.</p>
              </div>
            )}
          </div>
          
          {/* Horizontal Filmstrip bottom */}
          {project?.scenes && project.scenes.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-36 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
               <div className="w-full h-full overflow-x-auto overflow-y-hidden px-6 py-4 flex items-center space-x-4 custom-scrollbar-horizontal scroll-smooth">
                  {sortedScenes.map((scene, idx) => {
                    const isActive = activeSceneIndex === idx;
                    return (
                      <div 
                        key={scene.id || idx} 
                        onClick={() => setActiveSceneIndex(idx)}
                        className={cn(
                          "relative h-[84px] w-[148px] rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-300 group select-none",
                          isActive 
                            ? "border-2 border-primary ring-4 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-105 z-10" 
                            : "border-2 border-slate-800 hover:border-slate-500 hover:scale-105 opacity-60 hover:opacity-100"
                        )}
                      >
                        {scene.image?.imageBase64 ? (
                          <img src={`data:image/png;base64,${scene.image.imageBase64}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-xs font-bold text-slate-500">
                            <ImageIcon className="h-4 w-4 mb-1 opacity-50" />
                            {scene.sceneOrder}
                          </div>
                        )}
                        <div className="absolute top-1 left-1.5 text-[9px] font-black tracking-wider text-white drop-shadow-md">
                          {scene.sceneOrder}
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 flex gap-1.5 drop-shadow-md">
                          {scene.image && <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_theme(colors.green.500)]" title="Visual generated" />}
                          {scene.audio && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_theme(colors.blue.500)]" title="Audio generated" />}
                        </div>
                        
                        {!isActive && (
                           <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function StoryboardView() {
  return (
    <Suspense fallback={
      <div className="flex w-full h-full min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <Wand2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium">Loading workspace...</p>
        </div>
      </div>
    }>
      <StoryboardContent />
    </Suspense>
  );
}
