"use client";

import { LayoutDashboard, Folder, Image as ImageIcon, Settings, Plus, Trash2, Video } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllProjects, deleteProject } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function Sidebar() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/');
    },
    onError: (error) => {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project");
    }
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? This will remove all scenes, images, and audio.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <aside className="w-64 h-screen bg-background border-r border-border flex flex-col hidden md:flex shrink-0 font-sans">
      <div className="p-6 pb-4 border-b border-border">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground mb-6 italic tracking-tight font-heading">
          KATALIST
        </h1>
        <Button 
          className="w-full justify-start font-bold mb-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95 font-heading"
          onClick={() => router.push('/')}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Story
        </Button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-8 flex flex-col overflow-hidden bg-card/10 backdrop-blur-md">
        <div>
          <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 font-heading">Activity</p>
          <div className="space-y-1">
            {isLoading ? (
               <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse font-heading">Scanning...</div>
            ) : projects.length === 0 ? (
               <div className="px-3 py-2 text-xs text-muted-foreground italic font-heading">Empty library</div>
            ) : (
              projects.slice(0, 3).map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => router.push(`/?id=${p.id}`)}
                  className="flex justify-between items-center group px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground font-semibold transition-all cursor-pointer border border-transparent hover:border-border"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate font-heading">{p.title || 'Untitled'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 font-heading">Library</p>
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-4">
              {projects.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => router.push(`/?id=${p.id}`)}
                  className="flex justify-between items-center group px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-all cursor-pointer border border-transparent hover:border-border font-heading"
                >
                  <span className="truncate">{p.title || 'Untitled Project'}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0 rounded-lg"
                    onClick={(e) => handleDelete(e, p.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="mt-auto space-y-1 pt-4 border-t border-border">
          <Link href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground font-semibold transition-all border border-transparent hover:border-border font-heading">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">Assets</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground font-semibold transition-all border border-transparent hover:border-border font-heading">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </Link>
        </div>
      </nav>
      <div className="p-4 bg-background border-t border-border">
        <div className="flex items-center px-2 space-x-2">
            <div className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
            <p className="text-[10px] font-black text-muted-foreground tracking-tighter uppercase tracking-widest font-heading">v0.1.0 // Production</p>
        </div>
      </div>
    </aside>
  );
}
