import { Button } from "@/components/ui/button";
import { Download, PlayCircle, Settings } from "lucide-react";

interface TopBarProps {
  title: string;
  onGenerateAll?: () => void;
  isGenerating?: boolean;
}

export function TopBar({ title, onGenerateAll, isGenerating }: TopBarProps) {
  return (
    <header className="flex-none h-16 border-b bg-background flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground truncate max-w-[300px]" title={title}>
          {title}
        </h2>
        <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
          Draft
        </span>
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="outline" size="sm" className="hidden sm:flex" disabled>
          <Settings className="w-4 h-4 mr-2" />
          Project Settings
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={onGenerateAll} 
          disabled={isGenerating || !onGenerateAll}
        >
          <PlayCircle className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Generate All Assets'}
        </Button>
        <Button variant="secondary" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export to Revideo
        </Button>
      </div>
    </header>
  );
}
