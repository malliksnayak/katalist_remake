import React, { useState, useEffect } from 'react';
import SceneCard from './SceneCard';
import ExportView from './ExportView';
import { 
  Layout, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  RefreshCw, 
  FileBox, 
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function StoryboardFlow({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('board'); // 'board' or 'export'

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/v1/projects/${projectId}`);
        if (!response.ok) throw new Error("Project not found");
        const data = await response.json();
        // Scenes are sorted by orderIndex on the backend usually, but we sort again to be safe
        data.scenes.sort((a, b) => a.orderIndex - b.orderIndex);
        setProject(data);
      } catch (err) {
        console.error("Failed to load project:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 animate-in fade-in duration-500">
      <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
      <div className="text-xl font-medium tracking-tight">Syncing your storyboard...</div>
      <p className="text-sm text-slate-400 mt-2">Connecting to our high-fidelity engines.</p>
    </div>
  );
  
  if (error || !project) return (
    <div className="max-w-md mx-auto text-center p-10 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="text-rose-500 p-3 bg-rose-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
        <Clock className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
      <p className="text-slate-500 mt-2 mb-6">{error || "The project you requested doesn't exist."}</p>
      <button onClick={onBack} className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
        Back to Dashboard
      </button>
    </div>
  );

  if (view === 'export') {
    return <ExportView project={project} onBack={() => setView('board')} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-indigo-600 font-black mb-1">
             <Layout className="w-4 h-4" />
             <span className="text-[10px] uppercase tracking-[0.2em]">Storytelling Workspace</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">
            {project.title || "Untitled Story"}
          </h1>
          <div className="flex items-center space-x-4 text-slate-500 text-sm font-medium">
             <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">Active Draft</span>
             </div>
             <span className="text-slate-200 font-light">|</span>
             <span className="text-xs font-black uppercase tracking-widest text-slate-400">{project.scenes?.length || 0} Scenes Staged</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={onBack} 
             className="px-6 py-3 text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-all hover:-translate-x-1"
           >
             Exit Board
           </button>
           <button 
             onClick={() => setView('export')}
             className="group px-8 py-5 bg-indigo-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex items-center gap-4 border border-white/10"
           >
             Proceed to Export 
             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </header>

      {/* STORYBOARD LIST */}
      <div className="flex flex-col space-y-16">
        {project.scenes.map((scene, index) => (
          <SceneCard key={scene.id} scene={scene} index={index + 1} voice={project.voice} />
        ))}
      </div>
      
      {/* FOOTER ACTION */}
      <div className="pt-24 pb-12 text-center border-t border-slate-50 group">
         <div className="inline-flex h-12 w-12 bg-slate-50 rounded-2xl items-center justify-center text-slate-300 mb-6 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-all duration-500 ring-8 ring-transparent group-hover:ring-indigo-50/50">
            <FileBox className="w-5 h-5" />
         </div>
         <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Are you finished editing?</p>
         <button 
           onClick={() => setView('export')}
           className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-100/30"
         >
           Review All Assets & Download
         </button>
      </div>

    </div>
  );
}
