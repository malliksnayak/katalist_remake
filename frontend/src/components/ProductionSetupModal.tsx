"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, ImageIcon, PlayCircle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getVoices } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProductionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartProduction: (voice: string, imageModel: string) => void;
  currentImageModel: string;
}

export function ProductionSetupModal({ 
  isOpen, 
  onClose, 
  onStartProduction,
  currentImageModel 
}: ProductionSetupModalProps) {
  const [voice, setVoice] = useState("af_bella");
  const [imageModel, setImageModel] = useState(currentImageModel);

  const { data: voices = [], isLoading: isLoadingVoices } = useQuery({
    queryKey: ['voices'],
    queryFn: getVoices,
    enabled: isOpen
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 backdrop-blur-xl">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-foreground italic tracking-tight font-heading">PRODUCTION SETUP</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 font-heading">Configure your generation engines</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Audio Model Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary flex items-center font-heading">
                <Volume2 className="w-3 h-3 mr-2" /> Narration Voice
              </label>
              {isLoadingVoices ? (
                <div className="h-12 w-full bg-muted/50 animate-pulse rounded-xl flex items-center px-4 border border-border">
                  <Loader2 className="w-4 h-4 animate-spin mr-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-bold font-heading">Scanning library...</span>
                </div>
              ) : (
                <select 
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full h-12 bg-background border border-border rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-secondary/50 transition-all cursor-pointer font-sans"
                >
                  {voices.map((v: string) => (
                    <option key={v} value={v} className="bg-card">{v.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Visual Model Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center font-heading">
                <ImageIcon className="w-3 h-3 mr-2" /> Visual Engine
              </label>
              <div className="grid grid-cols-1 gap-2">
                {["FLUX"].map((model) => (
                  <button
                    key={model}
                    onClick={() => setImageModel(model)}
                    className={cn(
                      "h-12 flex items-center justify-between px-4 rounded-xl border text-xs font-black tracking-widest transition-all font-heading",
                      imageModel === model 
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {model}
                    {imageModel === model && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <Button 
              className="w-full h-14 bg-foreground hover:bg-foreground/90 text-background font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-foreground/5 active:scale-[0.98] transition-all font-heading"
              onClick={() => onStartProduction(voice, imageModel)}
            >
              <PlayCircle className="w-5 h-5 mr-3" />
              Start Full Production
            </Button>
            <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest leading-relaxed font-heading">
              Sequential rendering enabled: <br/>Narrator first, then high-fidelity visuals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
