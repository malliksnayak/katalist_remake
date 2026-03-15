"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Download, Film, Music, ImageIcon, Layout } from "lucide-react";
import { getProject, Project, downloadVideo } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

function VideoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('id');

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId as string),
    enabled: !!projectId,
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => downloadVideo(id, `${project?.title || 'video'}.mp4`),
    onSuccess: () => {
      // Internal download logic handled in api.ts
    },
    onError: (error) => {
      console.error("Download failed", error);
      alert("Video file not yet ready or generation failed.");
    }
  });

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background flex-1">
        <div className="max-w-md space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6">
            <Film className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter font-heading text-foreground">VIDEO THEATER</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Please select a project from the storyboard to access the final video export and cinema preview.</p>
          <Button onClick={() => router.push('/')} className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 shadow-xl shadow-primary/20">
             Return to Storyboard
          </Button>
        </div>
      </div>
    );
  }

  const allReady = project?.scenes.every(s => s.audio && s.image);
  const audioCount = project?.scenes.filter(s => s.audio).length || 0;
  const imageCount = project?.scenes.filter(s => s.image).length || 0;
  const total = project?.scenes.length || 0;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <TopBar 
        title={project?.title || "Loading..."} 
        onDownloadVideo={() => projectId && downloadMutation.mutate(projectId)}
        isDownloading={downloadMutation.isPending}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
         {/* Cinematic Background Glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
         
         <div className="w-full max-w-5xl aspect-video rounded-3xl bg-black border border-border overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative group">
            {allReady ? (
               <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary blur-2xl opacity-20 animate-pulse" />
                    <Button 
                      size="icon" 
                      className="h-24 w-24 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl relative z-10"
                      onClick={() => projectId && downloadMutation.mutate(projectId)}
                    >
                      {downloadMutation.isPending ? <Loader2 className="h-10 w-10 animate-spin" /> : <Play className="h-10 w-10 ml-2" />}
                    </Button>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-black italic font-heading tracking-tight">READY FOR EXPORT</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">4K Cinematic H.264 MP4</p>
                  </div>
               </div>
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center bg-muted/5">
                  <div className="max-w-sm w-full space-y-8 p-12">
                     <div className="flex justify-between items-end mb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary font-heading">Production Status</h4>
                        <span className="text-[10px] font-black text-muted-foreground font-heading">{Math.round(((audioCount + imageCount) / (total * 2)) * 100)}%</span>
                     </div>
                     <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000 ease-out" 
                          style={{ width: `${((audioCount + imageCount) / (total * 2)) * 100}%` }}
                        />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                           <Music className={cn("h-4 w-4", audioCount === total ? "text-secondary" : "text-muted-foreground opacity-30")} />
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground font-heading">Audio</p>
                           <p className="text-sm font-black font-heading">{audioCount}/{total}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                           <ImageIcon className={cn("h-4 w-4", imageCount === total ? "text-primary" : "text-muted-foreground opacity-30")} />
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground font-heading">Visuals</p>
                           <p className="text-sm font-black font-heading">{imageCount}/{total}</p>
                        </div>
                     </div>

                     <div className="pt-8 text-center">
                        <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed italic">
                          "Cinema is the most beautiful fraud in the world." <br/>
                          <span className="not-italic opacity-50">— Jean-Luc Godard</span>
                        </p>
                     </div>
                  </div>
               </div>
            )}
         </div>

         <div className="mt-12 flex gap-4">
            <Button 
               onClick={() => router.push(`/?id=${projectId}`)}
               variant="ghost" 
               className="h-12 px-8 rounded-full border border-border bg-card/50 backdrop-blur-md text-foreground font-bold hover:bg-card transition-all"
            >
               <Layout className="h-4 w-4 mr-2" /> Show Storyboard
            </Button>
            <Button 
               disabled={!allReady || downloadMutation.isPending}
               onClick={() => projectId && downloadMutation.mutate(projectId)}
               className="h-12 px-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
            >
               {downloadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
               Download Final Video
            </Button>
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
