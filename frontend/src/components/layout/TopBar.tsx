"use client";

import { Button } from "@/components/ui/button";
import { Download, PlayCircle, Settings, Loader2, ListVideo, Volume2, Film, Image as ImageIcon } from "lucide-react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  onGenerateAudio?: () => void;
  onGenerateVisuals?: () => void;
  onDownloadVideo?: () => void;
  isGeneratingAudio?: boolean;
  isGeneratingVisuals?: boolean;
  isDownloading?: boolean;
}

export function TopBar({ 
  title, 
  onGenerateAudio, 
  onGenerateVisuals,
  onDownloadVideo, 
  isGeneratingAudio,
  isGeneratingVisuals,
  isDownloading 
}: TopBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const projectId = searchParams.get('id');

  return (
    <header className="flex-none h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6 z-50 sticky top-0">
      <div className="flex items-center space-x-4 w-1/4">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase leading-none mb-1">
            Current Project
          </h2>
          <p className="text-sm font-bold text-slate-200 truncate max-w-[150px]" title={title}>
            {title}
          </p>
        </div>
      </div>

      {projectId && (
        <div className="flex items-center space-x-1 bg-slate-900/50 p-1 rounded-full border border-slate-800">
          <Link href={`/?id=${projectId}`}>
            <Button variant={pathname === '/' ? 'secondary' : 'ghost'} size="sm" className={cn(
               "h-8 rounded-full px-4 text-[11px] font-black uppercase tracking-wider transition-all",
               pathname === '/' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}>
              <ListVideo className="w-3.5 h-3.5 mr-2" /> Storyboard
            </Button>
          </Link>
          <Link href={`/audio?id=${projectId}`}>
            <Button variant={pathname === '/audio' ? 'secondary' : 'ghost'} size="sm" className={cn(
               "h-8 rounded-full px-4 text-[11px] font-black uppercase tracking-wider transition-all",
               pathname === '/audio' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}>
              <Volume2 className="w-3.5 h-3.5 mr-2" /> Audio
            </Button>
          </Link>
          <Link href={`/video?id=${projectId}`}>
            <Button variant={pathname === '/video' ? 'secondary' : 'ghost'} size="sm" className={cn(
               "h-8 rounded-full px-4 text-[11px] font-black uppercase tracking-wider transition-all",
               pathname === '/video' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}>
              <Film className="w-3.5 h-3.5 mr-2" /> Video
            </Button>
          </Link>
        </div>
      )}

      <div className="flex items-center space-x-2 w-1/3 justify-end">
        {onGenerateAudio && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full font-black text-[10px] uppercase tracking-wider text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
            onClick={onGenerateAudio} 
            disabled={isGeneratingAudio}
          >
            {isGeneratingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Volume2 className="w-3.5 h-3.5 mr-1.5" /> Batch Audio</>}
          </Button>
        )}
        {onGenerateVisuals && (
          <Button 
            variant="default" 
            size="sm" 
            className="rounded-full font-black text-[10px] uppercase tracking-wider shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
            onClick={onGenerateVisuals} 
            disabled={isGeneratingVisuals}
          >
            {isGeneratingVisuals ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Batch Visuals</>}
          </Button>
        )}
      </div>
    </header>
  );
}
