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
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tight italic">PRODUCTION SETUP</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configure your generation engines</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 text-slate-500 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Audio Model Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center">
                <Volume2 className="w-3 h-3 mr-2" /> Narration Voice
              </label>
              {isLoadingVoices ? (
                <div className="h-12 w-full bg-slate-800/50 animate-pulse rounded-xl flex items-center px-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-3 text-slate-500" />
                  <span className="text-xs text-slate-500 font-bold">Scanning library...</span>
                </div>
              ) : (
                <select 
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                >
                  {voices.map((v: string) => (
                    <option key={v} value={v} className="bg-slate-900">{v.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Visual Model Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center">
                <ImageIcon className="w-3 h-3 mr-2" /> Visual Engine
              </label>
              <div className="grid grid-cols-1 gap-2">
                {["FLUX"].map((model) => (
                  <button
                    key={model}
                    onClick={() => setImageModel(model)}
                    className={cn(
                      "h-12 flex items-center justify-between px-4 rounded-xl border text-xs font-black tracking-widest transition-all",
                      imageModel === model 
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                    )}
                  >
                    {model}
                    {imageModel === model && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <Button 
              className="w-full h-14 bg-white hover:bg-slate-100 text-black font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-white/5 active:scale-[0.98] transition-all"
              onClick={() => onStartProduction(voice, imageModel)}
            >
              <PlayCircle className="w-5 h-5 mr-3" />
              Start Full Production
            </Button>
            <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
              Sequential rendering enabled: <br/>Narrator first, then high-fidelity visuals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
