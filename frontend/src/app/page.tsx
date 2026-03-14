"use client";

import { useState, useEffect, Suspense } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Image as ImageIcon, AlignLeft, Plus, Loader2 } from "lucide-react";
import { SceneCard } from "@/components/SceneCard";
import { TopBar } from "@/components/layout/TopBar";
import { generateStoryboard, generateAllAudio, getProject, Project, Scene, downloadVideo } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

function StoryboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('id');

  const [storyInput, setStoryInput] = useState("");
  const [project, setProject] = useState<Project | null>(null);

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
    }
  }, [loadedProject]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setStoryInput("");
    }
  }, [projectId]);


  const mutation = useMutation({
    mutationFn: generateStoryboard,
    onSuccess: (data) => {
      setProject(data);
      router.push(`/?id=${data.id}`);
    },
    onError: (error) => {
      console.error("Storyboard generation failed", error);
      alert("Failed to generate storyboard. Please try again.");
    }
  });

  const batchAudioMutation = useMutation({
    mutationFn: (id: string) => generateAllAudio(id),
    onSuccess: () => {
      // Invalidate and refetch to ensure we have the LATEST data from DB with all relations
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      // We don't necessarily need an alert if the UI updates smoothly
    },
    onError: (error) => {
      console.error("Batch asset generation failed", error);
      alert("Failed to generate all assets. Check server logs.");
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
    mutation.mutate(storyInput);
  };

  const handleGenerateAll = () => {
    if (project?.id) {
      batchAudioMutation.mutate(project.id);
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
        onGenerateAll={handleGenerateAll}
        onDownloadVideo={handleDownloadVideo}
        isGenerating={batchAudioMutation.isPending}
        isDownloading={downloadVideoMutation.isPending}
      />
      
      <div className="flex-1 flex overflow-hidden isolate">
        {/* Left Column - Input Area (40%) */}
        <div className="w-full md:w-[40%] flex flex-col border-r bg-card/50 backdrop-blur pb-4 pt-6 px-6 relative z-10 shadow-sm transition-all duration-300 min-h-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Story Input</h1>
            <p className="text-sm text-muted-foreground mt-1 tracking-wide">Paste your text below to generate a dynamic storyboard.</p>
          </div>
          
          <div className="flex-1 min-h-0 flex flex-col relative group">
            <Textarea
              className="resize-none flex-1 font-mono text-sm leading-relaxed p-5 border shadow-inner transition-all focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl"
              placeholder="E.g., Once upon a time in a futuristic city..."
              value={storyInput}
              onChange={(e) => setStoryInput(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
          
          <Button 
            className="mt-6 h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-primary-foreground min-h-[3rem]"
            onClick={handleGenerate}
            disabled={mutation.isPending || !storyInput.trim()}
          >
            {mutation.isPending ? (
              <span className="flex items-center space-x-2 animate-pulse">
                <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Storyboard...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Storyboard
              </span>
            )}
          </Button>
        </div>

        {/* Right Column - Scene Feed (60%) */}
        <div className="w-full md:w-[60%] bg-muted/20 relative z-0 h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur z-20 shrink-0">
            <h2 className="text-lg font-semibold flex items-center tracking-tight">
              <ImageIcon className="w-5 h-5 mr-2 text-primary" />
              Scene Feed
            </h2>
            <div className="text-sm text-muted-foreground font-medium">
              {project?.scenes ? `${project.scenes.length} Scenes Generated` : 'Ready to Generate'}
            </div>
          </div>

          <ScrollArea className="flex-1 w-full px-6 py-6 pb-24 h-[calc(100vh-8rem)]">
            <div className="max-w-3xl mx-auto space-y-6">
              {mutation.isPending || isLoadingProject ? (
                // Skeleton Loader Array
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="mb-6 overflow-hidden border shadow-sm opacity-80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${i * 150}ms` }}>
                      <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-24 bg-primary/10" />
                          <Skeleton className="h-3 w-16 bg-muted-foreground/10" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full bg-primary/10" />
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex gap-4">
                          <Skeleton className="h-32 w-1/3 rounded-lg bg-muted" />
                          <div className="space-y-3 w-2/3">
                            <Skeleton className="h-4 w-full bg-muted-foreground/10" />
                            <Skeleton className="h-4 w-5/6 bg-muted-foreground/10" />
                            <Skeleton className="h-4 w-4/6 bg-muted-foreground/10" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : project?.scenes && project.scenes.length > 0 ? (
                <>
                  {sortedScenes.map((scene: Scene, index: number) => (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${index * 100}ms` }} key={scene.id || index}>
                      <SceneCard scene={scene} />
                    </div>
                  ))}
                  
                  {/* Bottom Pad */}
                  <div className="h-32" />
                </>
              ) : !projectId ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-8">
                  <div className="h-20 w-20 rounded-3xl bg-primary/10 rotate-12 flex items-center justify-center mb-8 ring-1 ring-primary/20 shadow-xl shadow-primary/5">
                    <Plus className="h-10 w-10 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight outline-none italic">Welcome to Katalist</h3>
                  <p className="max-w-md text-muted-foreground text-sm font-medium leading-relaxed mb-8">
                    To begin, enter your manuscript or script in the workspace on the left and click <span className="text-primary font-bold italic">Generate Storyboard</span>.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground opacity-70 animate-in fade-in duration-1000">
                  <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-6 ring-1 ring-primary/10 shadow-inner">
                    <AlignLeft className="h-10 w-10 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Scenes Yet</h3>
                  <p className="max-w-sm text-center text-sm">Enter your story text on the left and click generate to build your storyboard scenes.</p>
                </div>
              )}
            </div>
          </ScrollArea>
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
