import React from 'react';
import { 
  Download, 
  ArrowLeft, 
  FileArchive, 
  Image as ImageIcon, 
  Mic2, 
  ExternalLink,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ExportView({ project, onBack }) {
  const handleDownloadZip = () => {
    window.location.href = `/api/v1/projects/${project.id}/export`;
  };

  const scenes = [...project.scenes].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
           <button 
             onClick={onBack}
             className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest group"
           >
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             Back to Editor
           </button>
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
             Review & <span className="text-indigo-600">Export.</span>
           </h1>
           <p className="text-slate-500 text-lg font-medium tracking-tight max-w-xl">
             Your high-fidelity assets are staged and ready. Package them as a sequence-ready ZIP for your favorite editor.
           </p>
        </div>

        <button 
          onClick={handleDownloadZip}
          className="group relative overflow-hidden px-10 py-6 bg-indigo-600 text-white rounded-[24px] font-black text-lg tracking-widest uppercase shadow-2xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
          <FileArchive className="w-6 h-6 animate-pulse" />
          Download All (ZIP)
          <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
        </button>
      </div>

      {/* ASSET GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {scenes.map((scene, idx) => (
          <div key={scene.id} className="group bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/30 transition-all hover:-translate-y-2">
            
            {/* SEQUENCE INDICATOR */}
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="h-px w-6 bg-slate-100" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STAGED ASSET</span>
               </div>
               <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>

            {/* IMAGE PREVIEW */}
            <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden mb-6 border border-slate-100 relative group/img">
               {scene.imageBase64 ? (
                 <>
                   <img 
                     src={`/api/v1/scenes/${scene.id}/image`} 
                     alt={`Scene ${idx + 1}`} 
                     className="w-full h-full object-cover transition-transform group-hover/img:scale-110 duration-700"
                   />
                   <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-100 text-[10px] font-black text-slate-900 flex items-center gap-1.5 shadow-sm">
                      <ImageIcon className="w-3 h-3" />
                      PNG
                   </div>
                 </>
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                    <ImageIcon className="w-10 h-10 opacity-20" />
                    <span className="text-[10px] uppercase font-black tracking-widest">No Visual</span>
                 </div>
               )}
            </div>

            {/* AUDIO PREVIEW */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mic2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Vocal Asset</span>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">WAV 44.1kHz</span>
               </div>

               {scene.audioBase64 ? (
                 <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex items-center gap-4 group/audio">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover/audio:text-indigo-600 transition-colors shadow-sm">
                       <Mic2 className="w-4 h-4" />
                    </div>
                    <audio src={`/api/v1/scenes/${scene.id}/audio`} controls className="flex-1 h-8 custom-audio-player-mini" />
                 </div>
               ) : (
                 <div className="bg-slate-50/30 rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-slate-300 italic text-[10px] font-medium tracking-tight">
                    Audio asset not found
                 </div>
               )}
            </div>

            {/* NARRATION SNIPPET */}
            <div className="mt-6 pt-6 border-t border-slate-50">
               <p className="text-slate-500 text-[11px] font-medium leading-relaxed italic line-clamp-2 px-2">
                 "{scene.audioScript}"
               </p>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER CALL TO ACTION */}
      <div className="mt-24 text-center space-y-8 bg-indigo-50/30 rounded-[48px] p-20 border-2 border-dashed border-indigo-100 animate-in fade-in duration-1000">
         <div className="inline-flex h-16 w-16 bg-white rounded-3xl shadow-xl shadow-indigo-100 items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
         </div>
         <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Ready to bring your story to life?</h2>
         <p className="text-slate-500 max-w-lg mx-auto font-medium">
            Import these assets into any video editor. The sequence numbers will keep your timeline organized automatically.
         </p>
         <button 
           onClick={handleDownloadZip}
           className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95"
         >
           Export Project Files
         </button>
      </div>

      <style>{`
        .custom-audio-player-mini::-webkit-media-controls-enclosure {
          background-color: transparent;
        }
        .custom-audio-player-mini::-webkit-media-controls-panel {
          padding: 0;
        }
      `}</style>
    </div>
  );
}
