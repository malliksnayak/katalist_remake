"use client";

import { Button } from "@/components/ui/button";
import { Download, PlayCircle, Settings, Loader2, ListVideo, Volume2, Film } from "lucide-react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

interface TopBarProps {
  title: string;
  onGenerateAll?: () => void;
  onDownloadVideo?: () => void;
  isGenerating?: boolean;
  isDownloading?: boolean;
}

export function TopBar({ title, onGenerateAll, onDownloadVideo, isGenerating, isDownloading }: TopBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const projectId = searchParams.get('id');

  return (
    <header className="flex-none h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-50 sticky top-0 shadow-sm">
      <div className="flex items-center space-x-4 w-1/3">
        <h2 className="text-sm font-bold tracking-tight text-foreground/90 truncate max-w-[300px] uppercase tracking-widest" title={title}>
          {title}
        </h2>
        <span className="bg-muted text-muted-foreground text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-border">
          DRAFT
        </span>
      </div>

      {projectId && (
        <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-full border border-border/50">
          <Link href={`/?id=${projectId}`}>
            <Button variant={pathname === '/' ? 'default' : 'ghost'} size="sm" className={`h-8 rounded-full px-4 text-xs font-bold ${pathname !== '/' && 'text-muted-foreground'}`}>
              <ListVideo className="w-4 h-4 mr-2" /> Storyboard
            </Button>
          </Link>
          <Link href={`/audio?id=${projectId}`}>
            <Button variant={pathname === '/audio' ? 'default' : 'ghost'} size="sm" className={`h-8 rounded-full px-4 text-xs font-bold ${pathname !== '/audio' && 'text-muted-foreground'}`}>
              <Volume2 className="w-4 h-4 mr-2" /> Audio
            </Button>
          </Link>
          <Link href={`/video?id=${projectId}`}>
            <Button variant={pathname === '/video' ? 'default' : 'ghost'} size="sm" className={`h-8 rounded-full px-4 text-xs font-bold ${pathname !== '/video' && 'text-muted-foreground'}`}>
              <Film className="w-4 h-4 mr-2" /> Video
            </Button>
          </Link>
        </div>
      )}

      <div className="flex items-center space-x-3 w-1/3 justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden sm:flex rounded-full border-border/60 hover:bg-muted text-xs font-semibold"
          disabled
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        {onGenerateAll && (
          <Button 
            variant="default" 
            size="sm" 
            className="rounded-full font-bold text-xs shadow-md shadow-primary/20 group"
            onClick={onGenerateAll} 
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /></>
            ) : (
              <><PlayCircle className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" /> Batch</>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
