import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, addStaffing, addPhase, createTask, assignTask, getTasksByPhase, getAllUsers} from '../api/api';
import TaskBudget from '../components/TaskBudget';
import UtilizationTable from '../components/UtilizationTable';


interface ProjectStaffing { id: string; userId: string; roleName: string; hourlyRate: number; forecastHours: number; user: { name: string; email: string } }
interface ProjectPhase { id: string; name: string; startDate: string; endDate: string }
interface Task { id: string; title: string; description: string | null; budget: number; startDate: string; endDate: string; dueDate: string; status: string; assignments: TaskAssignment[] }
interface TaskAssignment { id: string; userId: string; hourlyRate: number; user: { name: string; email: string } }
interface Project { id: string; name: string; clientName: string; startDate: string; endDate: string; staffing: ProjectStaffing[]; phases: ProjectPhase[] }
interface User { id: string; name: string; email: string }

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [phaseTasks, setPhaseTasks] = useState<{ [phaseId: string]: Task[] }>({});

  const [showStaffingForm, setShowStaffingForm] = useState(false);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [staffingForm, setStaffingForm] = useState({ userId: '', roleName: '', hourlyRate: '', forecastHours: '' });
  const [phaseForm, setPhaseForm] = useState({ name: '', startDate: '', endDate: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', budget: '', startDate: '', endDate: '', dueDate: '', phaseId: '' });
  const [assignForm, setAssignForm] = useState({ userId: '', hourlyRate: '' });
  const [phaseBudgets, setPhaseBudgets] = useState<{ [phaseId: string]: { forecast: number; actual: number; remaining: number } }>({});

  useEffect(() => { loadProjectData() }, [projectId]);

  const loadProjectData = async () => {
    try {
      const [proj, usrs] = await Promise.all([getProject(projectId!), getAllUsers()]);
      setProject(proj); setUsers(usrs);
      const tasksData: { [phaseId: string]: Task[] } = {};
      for (const phase of proj.phases) tasksData[phase.id] = await getTasksByPhase(phase.id);
      setPhaseTasks(tasksData);
    } catch (err) { console.error(err) }
  };

  const handleAddStaffing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addStaffing(projectId!, { userId: staffingForm.userId, roleName: staffingForm.roleName, hourlyRate: parseFloat(staffingForm.hourlyRate), forecastHours: parseFloat(staffingForm.forecastHours) });
      await loadProjectData();
      setStaffingForm({ userId: '', roleName: '', hourlyRate: '', forecastHours: '' }); setShowStaffingForm(false);
    } catch { alert('Failed to add staffing') }
  };

  const handleAddPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await addPhase(projectId!, phaseForm); await loadProjectData(); setPhaseForm({ name: '', startDate: '', endDate: '' }); setShowPhaseForm(false) } catch { alert('Failed to add phase') }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(taskForm.endDate) < new Date(taskForm.startDate)) return alert('End date must be after start');
    if (new Date(taskForm.dueDate) < new Date(taskForm.startDate)) return alert('Due date cannot be before start');
    try {
      await createTask({ ...taskForm, budget: parseFloat(taskForm.budget) });
      await loadProjectData();
      setTaskForm({ title: '', description: '', budget: '', startDate: '', endDate: '', dueDate: '', phaseId: '' });
      setShowTaskForm(null);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to create task') }
  };

  const handleOpenAssignModal = (taskId: string) => { setSelectedTaskId(taskId); setShowAssignModal(true); setAssignForm({ userId: '', hourlyRate: '' }) }
  const handleUserSelect = (userId: string) => {
    const staffing = project?.staffing.find(s => s.userId === userId);
    setAssignForm({ userId, hourlyRate: staffing ? staffing.hourlyRate.toString() : '' });
  };
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedTaskId) return;
    try { await assignTask(selectedTaskId, { userId: assignForm.userId, hourlyRate: parseFloat(assignForm.hourlyRate) }); await loadProjectData(); setAssignForm({ userId: '', hourlyRate: '' }); setShowAssignModal(false); setSelectedTaskId(null) } catch (err: any) { alert(err.response?.data?.error || 'Failed to assign task') }
  };

  const totalForecast = project?.staffing.reduce((sum, s) => sum + s.hourlyRate * s.forecastHours, 0) || 0;
  if (!project) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen p-4 bg-gray-50 space-y-4">
      <header>
        <button onClick={() => navigate('/')} className="text-blue-600 underline mb-2 block">← Back</button>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-600">Client: {project.clientName}</p>
      </header>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded w-full max-w-md space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Assign Task</h3>
              <button onClick={() => { setShowAssignModal(false); setSelectedTaskId(null) }}>×</button>
            </div>
            <form onSubmit={handleAssignTask} className="space-y-2">
              <select value={assignForm.userId} onChange={e => handleUserSelect(e.target.value)} required className="w-full border p-1 rounded">
                <option value="">Select user...</option>
                {project.staffing.map(s => <option key={s.id} value={s.userId}>{s.user.name} - {s.roleName} (${s.hourlyRate}/hr)</option>)}
              </select>
              <input type="number" step="0.01" min="0" value={assignForm.hourlyRate} onChange={e => setAssignForm({ ...assignForm, hourlyRate: e.target.value })} required className="w-full border p-1 rounded" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowAssignModal(false); setSelectedTaskId(null) }} className="flex-1 bg-gray-200 rounded p-1">Cancel</button>
                <button type="submit" className="flex-1 bg-purple-600 text-white rounded p-1">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staffing */}
      <section className="bg-white p-3 rounded space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Staffing (Total: ${totalForecast.toFixed(2)})</h2>
          <button onClick={() => setShowStaffingForm(!showStaffingForm)} className="bg-blue-600 text-white rounded px-2 py-1">+ Add</button>
        </div>
        {showStaffingForm && (
          <form onSubmit={handleAddStaffing} className="space-y-1">
            <select value={staffingForm.userId} onChange={e => setStaffingForm({ ...staffingForm, userId: e.target.value })} required className="w-full border p-1 rounded">
              <option value="">Select user...</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="text" placeholder="Role" value={staffingForm.roleName} onChange={e => setStaffingForm({ ...staffingForm, roleName: e.target.value })} className="w-full border p-1 rounded" />
            <input type="number" placeholder="Rate" value={staffingForm.hourlyRate} onChange={e => setStaffingForm({ ...staffingForm, hourlyRate: e.target.value })} className="w-full border p-1 rounded" />
            <input type="number" placeholder="Hours" value={staffingForm.forecastHours} onChange={e => setStaffingForm({ ...staffingForm, forecastHours: e.target.value })} className="w-full border p-1 rounded" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowStaffingForm(false)} className="flex-1 bg-gray-200 rounded p-1">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded p-1">Add</button>
            </div>
          </form>
        )}
        <ul>
          {project.staffing.map(s => (
            <li key={s.id} className="flex justify-between text-sm border-b py-1">
              <span>{s.user.name} ({s.roleName})</span>
              <span>${s.hourlyRate} × {s.forecastHours}h = ${(s.hourlyRate * s.forecastHours).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white p-3 rounded space-y-2">
              <UtilizationTable projectId={projectId!} />
            </section>

      {/* Phases & Tasks */}
      <section className="bg-white p-3 rounded space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Phases & Tasks</h2>
          <button onClick={() => setShowPhaseForm(!showPhaseForm)} className="bg-green-600 text-white rounded px-2 py-1">+ Add Phase</button>
        </div>
        {showPhaseForm && (
          <form onSubmit={handleAddPhase} className="space-y-1">
            <input type="text" placeholder="Phase Name" value={phaseForm.name} onChange={e => setPhaseForm({ ...phaseForm, name: e.target.value })} className="w-full border p-1 rounded" />
            <input type="date" value={phaseForm.startDate} onChange={e => setPhaseForm({ ...phaseForm, startDate: e.target.value })} className="w-full border p-1 rounded" />
            <input type="date" value={phaseForm.endDate} onChange={e => setPhaseForm({ ...phaseForm, endDate: e.target.value })} className="w-full border p-1 rounded" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowPhaseForm(false)} className="flex-1 bg-gray-200 rounded p-1">Cancel</button>
              <button type="submit" className="flex-1 bg-green-600 text-white rounded p-1">Add</button>
            </div>
          </form>
        )}
        {project.phases.map(phase => (
          <div key={phase.id} className="border p-2 rounded space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{phase.name}</span>
              <button onClick={() => { setShowTaskForm(phase.id); setTaskForm({ ...taskForm, phaseId: phase.id }) }} className="bg-blue-600 text-white text-xs rounded px-2 py-1">+ Task</button>
            </div>

          {showTaskForm === phase.id && (
            <form onSubmit={handleCreateTask} className="space-y-1">
              <input type="text" placeholder="Task Title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full border p-1 rounded" required />
              <textarea placeholder="Description" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full border p-1 rounded"></textarea>
              <input type="number" placeholder="Budget" value={taskForm.budget} onChange={e => setTaskForm({ ...taskForm, budget: e.target.value })} className="w-full border p-1 rounded" required />
              
              <label className="block text-sm font-medium">Start Date</label>
              <input type="date" value={taskForm.startDate} onChange={e => setTaskForm({ ...taskForm, startDate: e.target.value })} className="w-full border p-1 rounded" required />
              
              <label className="block text-sm font-medium">End Date</label>
              <input type="date" value={taskForm.endDate} onChange={e => setTaskForm({ ...taskForm, endDate: e.target.value })} className="w-full border p-1 rounded" required />
              
              <label className="block text-sm font-medium">Due Date</label>
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full border p-1 rounded" required />
              
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowTaskForm(null)} className="flex-1 bg-gray-200 rounded p-1">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded p-1">Create</button>
              </div>
            </form>
          )}

          <ul>
            {phaseTasks[phase.id]?.map(task => (
              <li key={task.id} className="border p-1 rounded flex justify-between items-center">
                <span>
                  {task.title} (${task.budget})
                  <TaskBudget taskId={task.id} />
                </span>
                <button onClick={() => handleOpenAssignModal(task.id)} className="bg-purple-600 text-white text-xs rounded px-1 py-0.5">+ Assign</button>
                {task.assignments.length > 0 && (
                  <div className="text-xs flex flex-wrap gap-1 mt-1">
                    {task.assignments.map(a => <span key={a.id} className="bg-purple-50 px-1 rounded border">{a.user.name} (${a.hourlyRate}/hr)</span>)}
                  </div>
                )}
              </li>
            ))}
          </ul>
          </div>
        ))}
      </section>

  
    </div>
  );
}
