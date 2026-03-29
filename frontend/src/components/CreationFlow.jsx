import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ArrowRight,
  RefreshCw,
  Layout,
  Type,
  Palette,
  Eye,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mic2,
  Play,
  Volume2,
  VolumeX,
  User,
  Globe
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function CreationFlow({ onCreated }) {
  const [story, setStory] = useState("");
  const [visualStyle, setVisualStyle] = useState("Cinematic, highly detailed, 4k");
  const [voice, setVoice] = useState("af_bella");
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(null); // voice ID being previewed
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!story.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/projects/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, visualStyle, voice })
      });
      
      if (response.ok) {
        const project = await response.json();
        onCreated(project.id);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Failed to generate storyboard. Check your API keys.");
      }
    } catch (err) {
      console.error("Creation failed:", err);
      setError("Network error. Is the backend running?");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePreviewVoice = async (voiceId) => {
    if (isPreviewing === voiceId) {
      if (audioRef.current) audioRef.current.pause();
      setIsPreviewing(null);
      return;
    }

    setIsPreviewing(voiceId);
    try {
      const res = await fetch('/api/v1/audio/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Hello, I am your narrator for this storyboard. How do I sound?", voice: voiceId })
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) audioRef.current.src = url;
        audioRef.current.play();
        audioRef.current.onended = () => setIsPreviewing(null);
      }
    } catch (err) {
      console.error("Preview failed:", err);
      setIsPreviewing(null);
    }
  };

  const styleOptions = [
    { name: "Cinematic", value: "Cinematic, realistic, 4k, moody lighting", icon: <Palette className="w-3.5 h-3.5" /> },
    { name: "Anime", value: "Anime style, vibrant colors, Studio Ghibli inspired", icon: <Zap className="w-3.5 h-3.5" /> },
    { name: "Watercolor", value: "Beautiful watercolor painting, soft textures, pastel", icon: <Type className="w-3.5 h-3.5" /> },
    { name: "Digital Art", value: "Smooth digital illustration, concept art, sharp edges", icon: <Layout className="w-3.5 h-3.5" /> },
  ];

  const voiceOptions = [
    { id: "af_bella", name: "Bella", gender: "Female", region: "US", traits: "Warm, Professional, Clear", icon: <User className="w-4 h-4 text-rose-400" /> },
    { id: "am_adam", name: "Adam", gender: "Male", region: "US", traits: "Deep, Authoritative, Resonant", icon: <User className="w-4 h-4 text-blue-400" /> },
    { id: "bf_emma", name: "Emma", gender: "Female", region: "UK", traits: "Elegant, Sophisticated, Gentle", icon: <User className="w-4 h-4 text-indigo-400" /> },
    { id: "af_nicole", name: "Nicole", gender: "Female", region: "US", traits: "Energetic, Youthful, Bright", icon: <User className="w-4 h-4 text-amber-400" /> },
  ];

  if (isCreating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto space-y-12 animate-in fade-in duration-700">
         <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse rounded-full" />
            <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-indigo-100 overflow-hidden group">
               <RefreshCw className="w-10 h-10 text-indigo-500 animate-[spin_3s_linear_infinite]" />
               <SparklesIcon className="absolute top-2 right-2 w-4 h-4 text-amber-400 animate-bounce" />
            </div>
         </div>
         
         <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Katalist is Storyboarding...</h2>
            <p className="text-slate-500 font-medium max-w-sm mx-auto italic">
              "Synthesizing your narrative and preparing high-fidelity visual assets."
            </p>
         </div>

         <div className="w-full max-w-xs space-y-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Status</span>
              <span>EST. 30-45s</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-indigo-500 animate-[progress_40s_ease-in-out_forwards]" style={{ width: '0%' }} />
            </div>
         </div>
         
         <style>{`
           @keyframes progress {
             from { width: 0%; }
             to { width: 95%; }
           }
         `}</style>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-12 animate-in slide-in-from-bottom-8 duration-700">
      
      <audio ref={audioRef} className="hidden" />

      {/* INTRO SECTION */}
      <div className="text-center space-y-6">
         <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2 shadow-sm shadow-indigo-100/50">
           <SparklesIcon className="w-4 h-4" />
           PROJECT GENESIS
         </div>
         <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-4">
           Let's design your next <span className="text-indigo-600">Masterpiece.</span>
         </h1>
         <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto tracking-tight leading-relaxed">
           Transform your narrative into a cinematic storyboard. 
           Control every aesthetic and choose your persistent narrator.
         </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-16 group">
        
        {/* STORY INPUT */}
        <div className="space-y-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-xl shadow-indigo-100 transition-transform group-focus-within:scale-110">
                1
              </div>
              <label className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Narrative Input</label>
           </div>
           
           <div className="relative group/field transition-all bg-white rounded-[32px] p-1.5 shadow-2xl shadow-slate-200/50 border-2 border-slate-100 hover:border-indigo-100 focus-within:border-indigo-500 focus-within:shadow-indigo-50">
              <textarea 
               className="w-full p-10 bg-transparent outline-none text-slate-800 text-2xl font-medium leading-relaxed resize-none min-h-[240px] placeholder-slate-200"
               placeholder="Once upon a time in a digital landscape..."
               value={story}
               onChange={(e) => setStory(e.target.value)}
              />
              <div className="absolute right-10 bottom-10 flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-100 opacity-0 group-focus-within/field:opacity-100 transition-opacity">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{story.length} characters</span>
              </div>
           </div>
        </div>

        {/* STYLE & VOICE FLEX */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* LEFT: VISUALS (5/12) */}
           <div className="lg:col-span-4 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-xl shadow-indigo-100">
                  2
                </div>
                <label className="text-xl font-black text-slate-900 tracking-tighter uppercase">Visual Aesthetic</label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {styleOptions.map((opt) => (
                  <div 
                    key={opt.name}
                    onClick={() => setVisualStyle(opt.value)}
                    className={cn(
                      "flex flex-col items-start p-6 rounded-3xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group/opt shadow-sm",
                      visualStyle.includes(opt.name) || visualStyle === opt.value
                       ? "bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200" 
                       : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200"
                    )}
                  >
                     <div className={cn(
                       "w-10 h-10 rounded-xl mb-4 flex items-center justify-center",
                       visualStyle.includes(opt.name) || visualStyle === opt.value ? "bg-white/20" : "bg-slate-50 text-slate-400 group-hover/opt:text-indigo-500"
                     )}>
                       {opt.icon}
                     </div>
                     <span className="font-black text-[10px] uppercase tracking-[0.2em]">{opt.name}</span>
                  </div>
                ))}
              </div>

              <div className="relative group/custom">
                 <input 
                   className="w-full px-8 py-5 bg-slate-50/50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-800 text-sm font-semibold tracking-tight italic shadow-inner"
                   placeholder="Or describe custom aesthetic rules..."
                   value={visualStyle}
                   onChange={(e) => setVisualStyle(e.target.value)}
                 />
                 <SparklesIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within/custom:text-indigo-400 group-focus-within/custom:animate-pulse" />
              </div>
           </div>

           {/* RIGHT: NARRATOR TABLE (8/12) */}
           <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-xl shadow-indigo-100">
                  3
                </div>
                <label className="text-xl font-black text-slate-900 tracking-tighter uppercase">Narrator Selection</label>
              </div>

              <div className="bg-white rounded-[32px] border-2 border-slate-100 overflow-hidden shadow-2xl shadow-slate-100/50">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Select</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Narrator</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Traits</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Preview</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {voiceOptions.map((v) => (
                          <tr 
                            key={v.id} 
                            onClick={() => setVoice(v.id)}
                            className={cn(
                              "group/row cursor-pointer transition-colors",
                              voice === v.id ? "bg-indigo-50/30" : "hover:bg-slate-50/50"
                            )}
                          >
                             <td className="px-6 py-5">
                                <div className={cn(
                                   "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                                   voice === v.id ? "border-indigo-600 bg-indigo-600" : "border-slate-200 group-hover/row:border-indigo-300"
                                )}>
                                   {voice === v.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                      {v.icon}
                                   </div>
                                   <div>
                                      <p className="font-bold text-slate-800 text-sm leading-none mb-1">{v.name}</p>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{v.region} {v.gender}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <span className="text-xs font-medium text-slate-500 italic">"{v.traits}"</span>
                             </td>
                             <td className="px-6 py-5 text-right">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handlePreviewVoice(v.id); }}
                                  className={cn(
                                    "p-2.5 rounded-xl transition-all shadow-sm",
                                    isPreviewing === v.id 
                                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110" 
                                      : "bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100"
                                  )}
                                >
                                   {isPreviewing === v.id ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4 fill-current" />}
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {error && (
          <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-center gap-4 text-rose-600 animate-in slide-in-from-top-4">
             <div className="p-2 bg-rose-100 rounded-xl">
               <AlertCircle className="w-6 h-6 shrink-0" />
             </div>
             <p className="text-sm font-black uppercase tracking-tight">{error}</p>
          </div>
        )}

        {/* SUBMIT */}
        <div className="pt-8">
           <button 
             type="submit"
             disabled={!story.trim() || isCreating}
             className="w-full relative group/btn overflow-hidden rounded-[32px] p-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-2xl shadow-indigo-200/50"
           >
              <div className="absolute inset-0 bg-indigo-500 group-hover/btn:scale-x-110 transition-transform origin-left" />
              <div className="relative bg-indigo-600 px-12 py-8 rounded-[26px] flex items-center justify-center gap-6 text-white font-black text-2xl tracking-[0.05em] group-hover/btn:bg-transparent transition-colors shadow-inner border border-white/10 uppercase">
                 <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
                 Initialize Storyboard Engine
                 <ArrowRight className="w-8 h-8 group-hover/btn:translate-x-3 transition-transform" />
              </div>
           </button>
        </div>
      </form>
    </div>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
