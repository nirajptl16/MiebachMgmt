import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, addStaffing, addPhase, createTask, assignTask, getTasksByPhase, getAllUsers } from '../api/api';

interface ProjectStaffing {
  id: string;
  userId: string;
  roleName: string;
  hourlyRate: number;
  forecastHours: number;
  user: { name: string; email: string };
}

interface ProjectPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  budget: number;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: string;
  assignments: TaskAssignment[];
}

interface TaskAssignment {
  id: string;
  userId: string;
  hourlyRate: number;
  user: { name: string; email: string };
}

interface Project {
  id: string;
  name: string;
  clientName: string;
  startDate: string;
  endDate: string;
  staffing: ProjectStaffing[];
  phases: ProjectPhase[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [phaseTasks, setPhaseTasks] = useState<{ [phaseId: string]: Task[] }>({});
  
  // Form states
  const [showStaffingForm, setShowStaffingForm] = useState(false);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const [staffingForm, setStaffingForm] = useState({
    userId: '',
    roleName: '',
    hourlyRate: '',
    forecastHours: '',
  });
  
  const [phaseForm, setPhaseForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
    dueDate: '',
    phaseId: '',
  });

  const [assignForm, setAssignForm] = useState({
    userId: '',
    hourlyRate: '',
  });

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const [proj, usrs] = await Promise.all([
        getProject(projectId!),
        getAllUsers(),
      ]);
      setProject(proj);
      setUsers(usrs);
      
      // Load tasks for each phase
      const tasksData: { [phaseId: string]: Task[] } = {};
      for (const phase of proj.phases) {
        const tasks = await getTasksByPhase(phase.id);
        tasksData[phase.id] = tasks;
      }
      setPhaseTasks(tasksData);
    } catch (err) {
      console.error('Failed to load project', err);
    }
  };

  const handleAddStaffing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addStaffing(projectId!, {
        userId: staffingForm.userId,
        roleName: staffingForm.roleName,
        hourlyRate: parseFloat(staffingForm.hourlyRate),
        forecastHours: parseFloat(staffingForm.forecastHours),
      });
      await loadProjectData();
      setStaffingForm({ userId: '', roleName: '', hourlyRate: '', forecastHours: '' });
      setShowStaffingForm(false);
    } catch (err) {
      alert('Failed to add staffing');
    }
  };

  const handleAddPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPhase(projectId!, phaseForm);
      await loadProjectData();
      setPhaseForm({ name: '', startDate: '', endDate: '' });
      setShowPhaseForm(false);
    } catch (err) {
      alert('Failed to add phase');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const start = new Date(taskForm.startDate);
    const end = new Date(taskForm.endDate);
    const due = new Date(taskForm.dueDate);
    
    if (end < start) {
      alert('End date must be after start date');
      return;
    }
    
    if (due < start) {
      alert('Due date cannot be before start date');
      return;
    }
    
    try {
      await createTask({
        title: taskForm.title,
        description: taskForm.description,
        budget: parseFloat(taskForm.budget),
        startDate: taskForm.startDate,
        endDate: taskForm.endDate,
        dueDate: taskForm.dueDate,
        phaseId: taskForm.phaseId,
      });
      
      await loadProjectData();
      setTaskForm({ 
        title: '', 
        description: '', 
        budget: '', 
        startDate: '', 
        endDate: '', 
        dueDate: '', 
        phaseId: '' 
      });
      setShowTaskForm(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleOpenAssignModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowAssignModal(true);
    setAssignForm({ userId: '', hourlyRate: '' });
  };

  // Get hourly rate from project staffing when user is selected
  const handleUserSelect = (userId: string) => {
    const staffing = project?.staffing.find(s => s.userId === userId);
    setAssignForm({
      userId,
      hourlyRate: staffing ? staffing.hourlyRate.toString() : '',
    });
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return;
    
    try {
      await assignTask(selectedTaskId, {
        userId: assignForm.userId,
        hourlyRate: parseFloat(assignForm.hourlyRate),
      });
      await loadProjectData();
      setAssignForm({ userId: '', hourlyRate: '' });
      setShowAssignModal(false);
      setSelectedTaskId(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign task');
    }
  };

  const totalForecast = project?.staffing.reduce(
    (sum, s) => sum + s.hourlyRate * s.forecastHours,
    0
  ) || 0;

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="text-blue-600 mb-2 hover:underline">
            ← Back to Projects
          </button>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-gray-600">Client: {project.clientName}</p>
        </div>
      </div>

      {/* Task Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assign Task</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTaskId(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAssignTask}>
              <div className="space-y-4">
                <div>
                  <select
                    value={assignForm.userId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select user...</option>
                    {project?.staffing.map((staffing) => (
                      <option key={staffing.id} value={staffing.userId}>
                        {staffing.user.name} - {staffing.roleName} (${staffing.hourlyRate}/hr)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hourly Rate ($) *
                    <span className="text-xs text-gray-500 ml-2"></span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={assignForm.hourlyRate}
                    onChange={(e) => setAssignForm({ ...assignForm, hourlyRate: e.target.value })}
                    required
                    placeholder="100.00"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
             
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTaskId(null);
                  }}
                  className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Project Info */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Project Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Start:</span>
              <span className="ml-2 font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-600">End:</span>
              <span className="ml-2 font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Staffing Section */}
        <div className="bg-white rounded shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Project Staffing</h2>
              <p className="text-sm text-gray-600">
                Total Forecast: <span className="font-bold text-blue-600">${totalForecast.toFixed(2)}</span>
              </p>
            </div>
            <button
              onClick={() => setShowStaffingForm(!showStaffingForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              + Add Staffing
            </button>
          </div>

          {showStaffingForm && (
            <form onSubmit={handleAddStaffing} className="mb-6 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">User</label>
                  <select
                    value={staffingForm.userId}
                    onChange={(e) => setStaffingForm({ ...staffingForm, userId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select user...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <input
                    type="text"
                    value={staffingForm.roleName}
                    onChange={(e) => setStaffingForm({ ...staffingForm, roleName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={staffingForm.hourlyRate}
                    onChange={(e) => setStaffingForm({ ...staffingForm, hourlyRate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={staffingForm.forecastHours}
                    onChange={(e) => setStaffingForm({ ...staffingForm, forecastHours: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowStaffingForm(false)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
              </div>
            </form>
          )}

          {project.staffing.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No staffing added</p>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Role</th>
                  <th className="border p-2 text-right">Rate</th>
                  <th className="border p-2 text-right">Hours</th>
                  <th className="border p-2 text-right">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {project.staffing.map((s) => (
                  <tr key={s.id}>
                    <td className="border p-2">{s.user.name}</td>
                    <td className="border p-2">{s.roleName}</td>
                    <td className="border p-2 text-right">${s.hourlyRate}</td>
                    <td className="border p-2 text-right">{s.forecastHours}h</td>
                    <td className="border p-2 text-right">${(s.hourlyRate * s.forecastHours).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={4} className="border p-2 text-right">Total:</td>
                  <td className="border p-2 text-right text-blue-600">${totalForecast.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Phases & Tasks Section */}
        <div className="bg-white rounded shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Phases & Tasks</h2>
            <button
              onClick={() => setShowPhaseForm(!showPhaseForm)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              + Add Phase
            </button>
          </div>

          {/* Add Phase Form */}
          {showPhaseForm && (
            <form onSubmit={handleAddPhase} className="mb-6 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phase Name</label>
                  <input
                    type="text"
                    value={phaseForm.name}
                    onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
                    required
                    placeholder="Design Phase"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={phaseForm.startDate}
                    onChange={(e) => setPhaseForm({ ...phaseForm, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={phaseForm.endDate}
                    onChange={(e) => setPhaseForm({ ...phaseForm, endDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowPhaseForm(false)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Phase</button>
              </div>
            </form>
          )}

          {/* Phases List */}
          {project.phases.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No phases added yet. Click "Add Phase" to get started.</p>
          ) : (
            <div className="space-y-4">
              {project.phases.map((phase) => (
                <div key={phase.id} className="border rounded p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowTaskForm(phase.id);
                        setTaskForm({ ...taskForm, phaseId: phase.id });
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                    >
                      + Add Task
                    </button>
                  </div>

                  {/* Task Creation Form */}
                  {showTaskForm === phase.id && (
                    <form onSubmit={handleCreateTask} className="mb-4 p-3 bg-white rounded border">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium mb-1">Task Title *</label>
                          <input
                            type="text"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                            required
                            placeholder="Create Login UI"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <textarea
                            value={taskForm.description}
                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                            placeholder="Detailed task description..."
                            rows={2}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date *</label>
                          <input
                            type="date"
                            value={taskForm.startDate}
                            onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                            required
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">End Date *</label>
                          <input
                            type="date"
                            value={taskForm.endDate}
                            onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })}
                            required
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Due Date *</label>
                          <input
                            type="date"
                            value={taskForm.dueDate}
                            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                            required
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Budget ($) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={taskForm.budget}
                            onChange={(e) => setTaskForm({ ...taskForm, budget: e.target.value })}
                            required
                            placeholder="1500"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowTaskForm(null);
                            setTaskForm({ title: '', description: '', budget: '', startDate: '', endDate: '', dueDate: '', phaseId: '' });
                          }} 
                          className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          Create Task
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Task List */}
                  {!phaseTasks[phase.id] || phaseTasks[phase.id].length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">📋 No tasks in this phase yet</p>
                  ) : (
                    <div className="space-y-3 mt-3">
                      {phaseTasks[phase.id].map((task) => (
                        <div key={task.id} className="bg-white p-3 rounded border hover:shadow-md transition">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">✅ {task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              )}
                              
                              {/* Date Information */}
                              <div className="text-xs text-gray-500 mt-2 space-y-1">
                                <div className="flex gap-4 flex-wrap">
                                  <span>
                                    <span className="font-medium">Start:</span> {new Date(task.startDate).toLocaleDateString()}
                                  </span>
                                  <span>
                                    <span className="font-medium">End:</span> {new Date(task.endDate).toLocaleDateString()}
                                  </span>
                                  <span>
                                    <span className="font-medium">Due:</span> {new Date(task.dueDate).toLocaleDateString()}
                                    {new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && (
                                      <span className="ml-1 text-red-600 font-semibold"> OVERDUE</span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex gap-4">
                                  <span>
                                    <span className="font-medium">Budget:</span> ${Number(task.budget).toFixed(2)}
                                  </span>
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                    {task.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleOpenAssignModal(task.id)}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 ml-2 transition"
                            >
                              + Assign
                            </button>
                          </div>
                          {/* Assignments Display */}
                          {task.assignments && task.assignments.length > 0 && (
                            <div className="mt-2 border-t pt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Assigned to:</p>
                              <div className="flex flex-wrap gap-2">
                                {task.assignments.map((assignment) => (
                                  <div key={assignment.id} className="bg-purple-50 px-2 py-1 rounded text-xs border border-purple-200">
                                    <span className="font-medium">{assignment.user.name}</span>
                                    <span className="text-gray-600 ml-1">(${assignment.hourlyRate}/hr)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}