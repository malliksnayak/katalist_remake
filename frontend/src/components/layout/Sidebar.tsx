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
    <aside className="w-64 h-screen bg-card border-r flex flex-col hidden md:flex">
      <div className="p-6 pb-2 border-b">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-6">
          Katalist
        </h1>
        <Button 
          className="w-full justify-start font-semibold mb-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push('/')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-4 flex flex-col overflow-hidden">
        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Saved Projects</p>
          <ScrollArea className="flex-1 h-[400px]">
            <div className="space-y-1 block">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No projects yet.</div>
              ) : (
                projects.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => router.push(`/?id=${p.id}`)}
                    className="flex justify-between items-center group px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground font-medium transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <Video className="w-4 h-4 shrink-0" />
                      <span className="truncate">{p.title || 'Untitled Project'}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all shrink-0"
                      onClick={(e) => handleDelete(e, p.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="mt-auto space-y-1">
          <Link href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground font-medium transition-colors">
            <ImageIcon className="w-5 h-5" />
            <span>Library</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground font-medium transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground px-2">Katalist Remake v0.1</p>
      </div>
    </aside>
  );
}
