"use client";

import { useState, useEffect, Suspense } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Loader2, Download, Image as ImageIcon, PlayCircle } from "lucide-react";
import { getProject, Project, Scene, downloadVideo } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { TopBar } from "@/components/layout/TopBar";

function VideoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('id');

  const [project, setProject] = useState<Project | null>(null);

  const { data: loadedProject, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId as string),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (loadedProject) setProject(loadedProject);
  }, [loadedProject]);

  const downloadVideoMutation = useMutation({
    mutationFn: async () => {
      await downloadVideo(projectId as string, `${project?.title || 'video'}.mp4`);
    },
    onSuccess: () => alert("Video download complete!"),
    onError: (error) => {
      console.error("Video download failed", error);
      alert("Failed to initiate video download.");
    }
  });

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background flex-1">
        <h3 className="text-xl font-semibold mb-2">No Project Selected</h3>
        <p className="text-muted-foreground mb-4">Please select a project to download video.</p>
        <Button onClick={() => router.push('/')}>Go to Storyboard</Button>
      </div>
    );
  }

  const sortedScenes = [...(project?.scenes || [])].sort((a, b) => a.sceneOrder - b.sceneOrder);
  const totalScenes = sortedScenes.length;
  const audioCount = sortedScenes.filter(s => s.audio).length;
  const imageCount = sortedScenes.filter(s => s.image).length;
  const allReady = audioCount === totalScenes && imageCount === totalScenes && totalScenes > 0;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden flex-1 w-full">
      <TopBar title={project?.title || "Loading..."} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Video Options (40%) */}
        <div className="w-full md:w-[40%] flex flex-col border-r bg-card/50 backdrop-blur pb-4 pt-6 px-6 shadow-sm overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-xl font-bold flex items-center mb-2">
              <Film className="w-5 h-5 mr-2 text-primary" /> Final Production
            </h1>
            <p className="text-sm text-muted-foreground">Compile and render your generated assets into a final mp4 video.</p>
          </div>

          <Card className="mb-6 bg-muted/40 border-muted-foreground/20">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-sm border-b pb-2 mb-2 uppercase tracking-wide">Status Check</h3>
              <div className="flex justify-between text-sm"><span>Total Scenes:</span> <span className="font-bold">{totalScenes}</span></div>
              <div className="flex justify-between text-sm"><span>Images Ready:</span> <span className={imageCount === totalScenes ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>{imageCount}/{totalScenes}</span></div>
              <div className="flex justify-between text-sm"><span>Audio Ready:</span> <span className={audioCount === totalScenes ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>{audioCount}/{totalScenes}</span></div>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-14 text-base font-bold bg-primary uppercase tracking-wider"
            onClick={() => downloadVideoMutation.mutate()}
            disabled={downloadVideoMutation.isPending || !allReady}
          >
            {downloadVideoMutation.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Rendering Video...</>
            ) : (
              <><Download className="w-5 h-5 mr-2" /> Download Final Video</>
            )}
          </Button>
          {!allReady && totalScenes > 0 && (
            <p className="text-xs text-destructive mt-3 text-center bg-destructive/10 p-2 rounded-lg font-medium border border-destructive/20">
              Cannot render video: Missing some image or audio assets. Please generate them first.
            </p>
          )}
        </div>

        {/* Right Column - Image Preview (60%) */}
        <div className="w-full md:w-[60%] bg-muted/20 flex flex-col h-full">
           <ScrollArea className="flex-1 w-full px-6 py-6 pb-24 h-[calc(100vh-4rem)]">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {isLoadingProject ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="shadow-sm break-inside-avoid"><CardContent className="p-2 aspect-video bg-muted/50 rounded flex items-center justify-center"><ImageIcon className="w-10 h-10 text-muted-foreground/30"/></CardContent></Card>
                  ))}
                </>
              ) : project?.scenes && project.scenes.length > 0 ? (
                sortedScenes.map((scene: Scene, i: number) => (
                  <Card key={scene.id || i} className="overflow-hidden shadow-md break-inside-avoid">
                    <div className="p-2 bg-black/80 flex justify-between items-center text-[10px] font-bold text-white/80 absolute top-2 left-2 right-2 rounded-lg z-10 backdrop-blur-md">
                       Scene {scene.sceneOrder}
                       {scene.image ? <span className="text-green-400">IMG ✓</span> : <span className="text-red-400">IMG ✗</span>}
                    </div>
                    <CardContent className="p-0 relative aspect-video bg-black flex items-center justify-center">
                      {scene.image?.imageBase64 ? (
                        <Image 
                          src={`data:image/png;base64,${scene.image.imageBase64}`}
                          alt={`Scene ${scene.sceneOrder}`}
                          layout="fill"
                          objectFit="cover"
                          className="opacity-90 hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="text-muted-foreground/50 flex flex-col items-center">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-50"/>
                          <span className="text-xs font-semibold uppercase tracking-widest">No Image</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex justify-center mt-20 text-muted-foreground italic text-sm text-center w-full">No scenes to display.</div>
              )}
            </div>
           </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default function VideoPage() {
  return (
    <Suspense fallback={<div className="flex w-full h-full items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>}>
      <VideoContent />
    </Suspense>
  );
}
