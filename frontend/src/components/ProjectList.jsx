import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Clock, 
  ChevronRight, 
  Trash2, 
  Search, 
  LayoutGrid, 
  ListIcon,
  Layout,
  PlusCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ProjectList({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    
    try {
      const response = await fetch(`/api/v1/projects/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.visualStyle?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse py-20">
      <Layout className="w-12 h-12 text-slate-200 mb-4" />
      <div className="h-6 w-48 bg-slate-200 rounded-lg mb-2" />
      <div className="h-4 w-32 bg-slate-100 rounded-lg" />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-6xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
         <div className="space-y-2">
           <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Asset Storyboards</h2>
           <p className="text-slate-500 font-medium">Manage and generate media for your creative narratives.</p>
         </div>
         
         <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-sm"
              placeholder="Search by title or style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <button 
             onClick={fetchProjects}
             className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all active:scale-95"
           >
             <RefreshCw className="w-5 h-5" />
           </button>
         </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 py-32 flex flex-col items-center justify-center text-center px-6 shadow-sm">
           <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 text-indigo-500">
              <Folder className="w-10 h-10" />
           </div>
           <h3 className="text-xl font-bold text-slate-800">No projects yet</h3>
           <p className="text-slate-400 mt-2 mb-8 max-w-xs">Your storyboard journey begins here. Create your first narrative to see it come to life.</p>
           <button 
             onClick={() => document.querySelector('button:has(.lucide-plus)').click()} 
             className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transform active:scale-95 transition-all flex items-center gap-2"
           >
             <PlusCircle className="w-5 h-5" />
             Create First Board
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredProjects.map((project) => (
             <div 
              key={project.id} 
              onClick={() => onSelectProject(project.id)}
              className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => handleDelete(e, project.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <div className="flex flex-col h-full space-y-4">
                   <div className="flex items-start justify-between">
                      <div className={cn(
                        "p-3 rounded-2xl text-white transition-colors",
                        project.visualStyle?.toLowerCase().includes('dark') ? 'bg-slate-800' : 'bg-indigo-500'
                      )}>
                        <LayoutGrid className="w-6 h-6" />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <h4 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {project.title || "Untitled Project"}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Style:</span>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase leading-none">
                          {project.visualStyle || "Default"}
                        </span>
                      </div>
                   </div>

                   <div className="pt-2 mt-auto border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{project.scenes?.length || 0} Scenes</span>
                      </div>
                      <div className="text-indigo-600 font-bold text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                        OPEN BOARD
                        <ChevronRight className="w-3 h-3" />
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
