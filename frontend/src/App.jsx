import React, { useState, useEffect } from 'react';
import StoryboardFlow from './components/StoryboardFlow';
import ProjectList from './components/ProjectList';
import CreationFlow from './components/CreationFlow';
import { Layout, Plus, List as ListIcon } from 'lucide-react';

function App() {
  const [projectId, setProjectId] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'create', 'board'

  const handleProjectCreated = (id) => {
    setProjectId(id);
    setView('board');
  };

  const handleSelectProject = (id) => {
    setProjectId(id);
    setView('board');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('list')}>
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Layout className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">Katalist</span>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={() => setView('list')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'list' ? 'bg-slate-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <ListIcon className="w-4 h-4" />
                <span>My Projects</span>
              </button>
              <button 
                onClick={() => setView('create')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all transform active:scale-95 ${
                  view === 'create' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>New Storyboard</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' && (
          <ProjectList onSelectProject={handleSelectProject} />
        )}
        {view === 'create' && (
          <CreationFlow onCreated={handleProjectCreated} />
        )}
        {view === 'board' && projectId && (
          <StoryboardFlow projectId={projectId} onBack={() => setView('list')} />
        )}
      </main>
    </div>
  );
}

export default App;
