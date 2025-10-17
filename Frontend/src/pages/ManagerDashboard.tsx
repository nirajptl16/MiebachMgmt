import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllProjects } from '../api/api';

interface Project {
  id: string;
  name: string;
  clientName: string;
  startDate: string;
  endDate: string;
}

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="max-w-5xl mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Manager Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-500">Hi, {user?.name}</span>
          <button
            onClick={logout}
            className="px-3 py-1 rounded transition bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <button
            onClick={() => navigate('/projects/create')}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
          >
            + Create Project
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 text-gray-400 text-base">
            Loading projects...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-6 text-lg">No projects yet</p>
            <button
              onClick={() => navigate('/projects/create')}
              className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
            >
              Create Your First Project
            </button>
          </div>
        )}

        {/* Project List */}
        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition flex flex-col gap-2 border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {project.name}
                </h3>
                <p className="text-gray-500 text-sm mb-2">
                  {project.clientName}
                </p>
                <div className="flex gap-2">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    Start: {new Date(project.startDate).toLocaleDateString()}
                  </span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                    End: {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}