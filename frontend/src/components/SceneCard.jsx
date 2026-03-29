import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Image as ImageIcon, 
  Mic2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2,
  Maximize2,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function SceneCard({ scene, index, voice }) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); 
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [hasImage, setHasImage] = useState(!!scene.mimeType); 
  const [hasAudio, setHasAudio] = useState(!!scene.audioBase64);
  
  const [imgUrl, setImgUrl] = useState(scene.imageBase64 ? `/api/v1/scenes/${scene.id}/image?t=${Date.now()}` : null);
  const [audioUrl, setAudioUrl] = useState(scene.audioBase64 ? `/api/v1/scenes/${scene.id}/audio?t=${Date.now()}` : null);

  const [localAudioScript, setLocalAudioScript] = useState(scene.audioScript || "");
  const [localImagePrompt, setLocalImagePrompt] = useState(scene.imagePrompt || "");

  const handleUpdateScene = async (field, value) => {
    if (value === scene[field]) return; 
    
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/v1/scenes/${scene.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error("Failed to update scene:", error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateImage = async (forceReload = false) => {
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/v1/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId: scene.id, model: "FLUX", force: forceReload })
      });
      if (res.ok) {
        setImgUrl(`/api/v1/scenes/${scene.id}/image?t=${Date.now()}`);
        setHasImage(true);
      }
    } catch (error) {
      console.error("Image generation failed:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateAudio = async (forceReload = false) => {
    setIsGeneratingAudio(true);
    try {
      const res = await fetch('/api/v1/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId: scene.id, voice: voice || "af_bella", force: forceReload })
      });
      if (res.ok) {
        setAudioUrl(`/api/v1/scenes/${scene.id}/audio?t=${Date.now()}`);
        setHasAudio(true);
      }
    } catch (error) {
      console.error("Audio generation failed:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <>
      <div className="group bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-100/50 hover:border-indigo-200 flex flex-col md:flex-row gap-0 min-h-[440px]">
        
        {/* SCENE INDICATOR SIDEBAR */}
        <div className="w-full md:w-20 bg-slate-50 border-r border-slate-100 flex md:flex-col items-center justify-center p-6 gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-800 flex items-center justify-center font-black text-lg">
            {index}
          </div>
          <div className="hidden md:block h-px bg-slate-200 w-10" />
          <div className="hidden md:flex flex-col space-y-6 text-slate-300 group-hover:text-indigo-400 transition-colors">
             <ImageIcon className="w-5 h-5 cursor-default" />
             <Mic2 className="w-5 h-5 cursor-default" />
          </div>
        </div>

        {/* TEXT EDITOR AREA */}
        <div className="flex-1 p-10 space-y-8">
          <div className="flex items-center justify-between">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2.5">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
               Voiceover Script
             </h3>
             <div className="flex items-center space-x-3">
               {saveStatus === 'saving' && <div className="text-[10px] text-indigo-400 animate-pulse font-bold tracking-tight">SYNCING...</div>}
               {saveStatus === 'saved' && <div className="text-[10px] text-emerald-500 font-black flex items-center gap-1.5 animate-in slide-in-from-right-2 duration-300"><CheckCircle2 className="w-3.5 h-3.5" /> SAVED</div>}
               {saveStatus === 'error' && <div className="text-[10px] text-rose-500 font-black flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> ERROR</div>}
             </div>
          </div>

          <div className="relative group/text">
            <textarea 
              className="w-full p-6 bg-slate-50/50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-8 focus:ring-indigo-50 outline-none transition-all text-slate-800 placeholder-slate-300 text-xl font-medium leading-relaxed resize-none"
              value={localAudioScript}
              onChange={(e) => setLocalAudioScript(e.target.value)}
              onBlur={(e) => handleUpdateScene('audioScript', e.target.value)}
              rows={5}
              placeholder="What happens in this scene?"
            />
            <div className="absolute right-4 bottom-4 text-slate-300 text-[10px] font-black uppercase tracking-widest pointer-events-none opacity-0 group-focus-within/text:opacity-100 transition-opacity">
              {localAudioScript.length} CHARS
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2.5">
               <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
               Visual Context
             </h3>
             <div className="relative">
               <input 
                 className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 hover:border-slate-200 focus:border-indigo-500 outline-none transition-all text-slate-600 text-base font-medium italic placeholder-slate-200"
                 value={localImagePrompt}
                 onChange={(e) => setLocalImagePrompt(e.target.value)}
                 onBlur={(e) => handleUpdateScene('imagePrompt', e.target.value)}
                 placeholder="Describe the cinematic visual for this moment..."
               />
             </div>
          </div>
        </div>

        {/* MEDIA PREVIEW AREA */}
        <div className="w-full md:w-[480px] bg-slate-50/50 p-10 flex flex-col space-y-8 border-l border-slate-100">
          
          {/* IMAGE PREVIEW */}
          <div className="relative group/media aspect-video bg-white rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 flex flex-col items-center justify-center border border-slate-200 ring-1 ring-black/5 min-h-[220px]">
            {imgUrl ? (
              <>
                 <img src={imgUrl} alt="Scene Visual" className="object-cover w-full h-full animate-in fade-in zoom-in-95 duration-700" />
                 <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/media:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button 
                      onClick={() => handleGenerateImage(true)} 
                      disabled={isGeneratingImage} 
                      className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all hover:scale-110 active:scale-90"
                      title="Regenerate Visual"
                    >
                       <RefreshCw className={cn("w-6 h-6", isGeneratingImage && "animate-spin")} />
                    </button>
                    <button 
                      onClick={() => setIsMaximized(true)}
                      className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-90"
                      title="Expand View"
                    >
                       <Maximize2 className="w-6 h-6" />
                    </button>
                 </div>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-6 text-slate-400 p-8 text-center w-full">
                 <div className={cn("w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center transition-all", isGeneratingImage && "scale-110 shadow-2xl bg-white")}>
                   {isGeneratingImage ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <ImageIcon className="w-8 h-8 opacity-20" />}
                 </div>
                 <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{isGeneratingImage ? "SYNTHESIZING..." : "AWAITING VISUAL"}</p>
                   <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-[200px] mx-auto">Click below to generate high-fidelity cinematic imagery.</p>
                 </div>
                 {!isGeneratingImage && (
                   <button 
                    onClick={() => handleGenerateImage(false)} 
                    className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                   >
                     <Sparkles className="w-4 h-4" />
                     Generate Image
                   </button>
                 )}
              </div>
            )}
          </div>

          {/* AUDIO PREVIEW */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  NARRATION PREVIEW
               </h3>
               {isGeneratingAudio && (
                 <div className="flex items-center gap-2 text-indigo-500 text-[9px] font-black animate-pulse uppercase tracking-widest">
                   <RefreshCw className="w-3 h-3 animate-spin" />
                   RECORDING...
                 </div>
               )}
            </div>
            
            {audioUrl ? (
              <div className="bg-white rounded-2xl py-4 px-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6 group/audio">
                <audio src={audioUrl} controls className="flex-1 h-10 custom-audio-player" />
                <button 
                  onClick={() => handleGenerateAudio(true)} 
                  disabled={isGeneratingAudio} 
                  className="p-2 text-slate-300 hover:text-indigo-600 transition-all hover:scale-110 active:scale-90"
                  title="Regenerate Voiceover"
                >
                  <RefreshCw className={cn("w-5 h-5", isGeneratingAudio && "animate-spin")} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => handleGenerateAudio(false)} 
                disabled={isGeneratingAudio} 
                className={cn(
                  "w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-200 hover:bg-white hover:text-indigo-600 transition-all font-bold group",
                  isGeneratingAudio && "border-indigo-300 bg-white"
                )}
              >
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[10px] uppercase tracking-widest">Preparing Audio Engine...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                      <Mic2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs uppercase tracking-widest">Generate Narration</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* IMAGE MAXIMIZE MODAL */}
      {isMaximized && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300 p-8 md:p-20">
           <button 
             onClick={() => setIsMaximized(false)}
             className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90"
           >
              <X className="w-8 h-8" />
           </button>
           
           <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col items-center justify-center space-y-8">
              <div className="flex-1 w-full overflow-hidden rounded-3xl shadow-2xl border border-white/10">
                 <img 
                   src={imgUrl} 
                   alt="Maximized Scene Visual" 
                   className="w-full h-full object-contain"
                 />
              </div>
              
              <div className="w-full max-w-3xl text-center space-y-4">
                 <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                   <Sparkles className="w-4 h-4" />
                   Scene {index} Visual
                 </div>
                 <p className="text-white/60 text-lg font-medium italic tracking-tight leading-relaxed">
                   "{localImagePrompt}"
                 </p>
              </div>
           </div>
        </div>
      )}
    </>
  );
}

function Sparkles({ className }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
