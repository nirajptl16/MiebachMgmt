import { useState, useEffect } from 'react';
import type { User, Project, Phase, ProjectStaffing, BudgetData, Utilization } from '../types/types';
import { projectAPI, staffingAPI, phaseAPI, taskAPI, invoiceAPI } from '../services/api';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function ManagerDashboard({ user, onLogout }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [utilization, setUtilization] = useState<Utilization[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'budget' | 'invoice'>('create');

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: '',
    clientName: '',
    startDate: '',
    endDate: '',
  });

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
    phaseId: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    dueDate: '',
    budget: '',
  });

  const [assignmentForm, setAssignmentForm] = useState({
    taskId: '',
    userId: '',
    hourlyRate: '',
  });

  const [invoiceForm, setInvoiceForm] = useState({
    projectId: '',
    periodStart: '',
    periodEnd: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data);
      
      // Extract unique users from staffing
      const allUsers = new Map();
      res.data.forEach((p: Project) => {
        p.staffing?.forEach((s: ProjectStaffing) => {
          if (s.user) {
            allUsers.set(s.user.id, s.user);
          }
        });
      });
      setUsers(Array.from(allUsers.values()));
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectAPI.create(projectForm);
      setProjectForm({ name: '', clientName: '', startDate: '', endDate: '' });
      loadProjects();
      alert('Project created!');
    } catch (err) {
      alert('Failed to create project');
    }
  };

  const handleAddStaffing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      await staffingAPI.create(selectedProject.id, staffingForm);
      setStaffingForm({ userId: '', roleName: '', hourlyRate: '', forecastHours: '' });
      loadProjects();
      alert('Staffing added!');
    } catch (err) {
      alert('Failed to add staffing');
    }
  };

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      await phaseAPI.create(selectedProject.id, phaseForm);
      setPhaseForm({ name: '', startDate: '', endDate: '' });
      loadProjects();
      alert('Phase created!');
    } catch (err) {
      alert('Failed to create phase');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskAPI.create(taskForm.phaseId, taskForm);
      setTaskForm({
        phaseId: '',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        dueDate: '',
        budget: '',
      });
      loadProjects();
      alert('Task created!');
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskAPI.assign(assignmentForm.taskId, {
        userId: assignmentForm.userId,
        hourlyRate: parseFloat(assignmentForm.hourlyRate),
      });
      setAssignmentForm({ taskId: '', userId: '', hourlyRate: '' });
      loadProjects();
      alert('Task assigned!');
    } catch (err) {
      alert('Failed to assign task');
    }
  };

  const loadBudgetAndUtilization = async (projectId: string) => {
    try {
      const [budgetRes, utilizationRes] = await Promise.all([
        projectAPI.getBudget(projectId),
        projectAPI.getUtilization(projectId),
      ]);
      setBudget(budgetRes.data);
      setUtilization(utilizationRes.data);
    } catch (err) {
      console.error('Failed to load budget/utilization', err);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await invoiceAPI.create(invoiceForm);
      alert(`Invoice generated! Total: $${res.data.totalAmount.toFixed(2)}`);
      console.log('Invoice details:', res.data);
    } catch (err) {
      alert('Failed to generate invoice');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Manager Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded ${
              activeTab === 'create' ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
          >
            Create & Manage
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-4 py-2 rounded ${
              activeTab === 'budget' ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
          >
            Budget & Utilization
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-4 py-2 rounded ${
              activeTab === 'invoice' ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
          >
            Invoices
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Create Project */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4">Create Project</h2>
              <form onSubmit={handleCreateProject} className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Project Name"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <input
                  placeholder="Client Name"
                  value={projectForm.clientName}
                  onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <button type="submit" className="col-span-2 bg-blue-500 text-white p-2 rounded">
                  Create Project
                </button>
              </form>
            </div>

            {/* Select Project */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4">Select Project</h2>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const proj = projects.find((p) => p.id === e.target.value);
                  setSelectedProject(proj || null);
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.clientName})
                  </option>
                ))}
              </select>
            </div>

            {selectedProject && (
              <>
                {/* Add Staffing */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-bold mb-4">Add Staffing to {selectedProject.name}</h2>
                  <form onSubmit={handleAddStaffing} className="grid grid-cols-2 gap-4">
                    <select
                      value={staffingForm.userId}
                      onChange={(e) => setStaffingForm({ ...staffingForm, userId: e.target.value })}
                      className="p-2 border rounded"
                      required
                    >
                      <option value="">-- Select User --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Role Name (e.g., Consultant)"
                      value={staffingForm.roleName}
                      onChange={(e) => setStaffingForm({ ...staffingForm, roleName: e.target.value })}
                      className="p-2 border rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Hourly Rate"
                      value={staffingForm.hourlyRate}
                      onChange={(e) => setStaffingForm({ ...staffingForm, hourlyRate: e.target.value })}
                      className="p-2 border rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Forecast Hours"
                      value={staffingForm.forecastHours}
                      onChange={(e) => setStaffingForm({ ...staffingForm, forecastHours: e.target.value })}
                      className="p-2 border rounded"
                      required
                    />
                    <button type="submit" className="col-span-2 bg-green-500 text-white p-2 rounded">
                      Add Staffing
                    </button>
                  </form>

                  {/* Show current staffing */}
                  {selectedProject.staffing && selectedProject.staffing.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Current Staffing:</h3>
                      <table className="w-full border">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2 border text-left">Name</th>
                            <th className="p-2 border text-left">Role</th>
                            <th className="p-2 border text-right">Rate</th>
                            <th className="p-2 border text-right">Forecast Hours</th>
                            <th className="p-2 border text-right">Budget</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProject.staffing.map((s) => (
                            <tr key={s.id}>
                              <td className="p-2 border">{s.user?.name}</td>
                              <td className="p-2 border">{s.roleName}</td>
                              <td className="p-2 border text-right">${s.hourlyRate}</td>
                              <td className="p-2 border text-right">{s.forecastHours}h</td>
                              <td className="p-2 border text-right">
                                ${(s.hourlyRate * s.forecastHours).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Create Phase */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-bold mb-4">Create Phase</h2>
                  <form onSubmit={handleCreatePhase} className="grid grid-cols-3 gap-4">
                    <input
                      placeholder="Phase Name"
                      value={phaseForm.name}
                      onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
                      className="p-2 border rounded"
                      required
                    />
                    <input
                      type="date"
                      value={phaseForm.startDate}
                      onChange={(e) => setPhaseForm({ ...phaseForm, startDate: e.target.value })}
                      className="p-2 border rounded"
                      required
                    />
                    <input
                      type="date"
                      value={phaseForm.endDate}
                      onChange={(e) => setPhaseForm({ ...phaseForm, endDate: e.target.value })}
                      className="p-2 border rounded"
                      required
                    />
                    <button type="submit" className="col-span-3 bg-purple-500 text-white p-2 rounded">
                      Create Phase
                    </button>
                  </form>

                  {selectedProject.phases && selectedProject.phases.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Phases:</h3>
                      <ul className="space-y-1">
                        {selectedProject.phases.map((phase) => (
                          <li key={phase.id} className="p-2 bg-gray-50 rounded">
                            {phase.name} ({phase.tasks?.length || 0} tasks)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Create Task */}
                {selectedProject.phases && selectedProject.phases.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-bold mb-4">Create Task</h2>
                    <form onSubmit={handleCreateTask} className="grid grid-cols-2 gap-4">
                      <select
                        value={taskForm.phaseId}
                        onChange={(e) => setTaskForm({ ...taskForm, phaseId: e.target.value })}
                        className="p-2 border rounded col-span-2"
                        required
                      >
                        <option value="">-- Select Phase --</option>
                        {selectedProject.phases.map((phase) => (
                          <option key={phase.id} value={phase.id}>
                            {phase.name}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="Task Title"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        className="p-2 border rounded col-span-2"
                        required
                      />
                      <input
                        placeholder="Description"
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        className="p-2 border rounded col-span-2"
                      />
                      <input
                        type="date"
                        placeholder="Start Date"
                        value={taskForm.startDate}
                        onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                        className="p-2 border rounded"
                        required
                      />
                      <input
                        type="date"
                        placeholder="End Date"
                        value={taskForm.endDate}
                        onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })}
                        className="p-2 border rounded"
                        required
                      />
                      <input
                        type="date"
                        placeholder="Due Date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="p-2 border rounded"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Budget"
                        value={taskForm.budget}
                        onChange={(e) => setTaskForm({ ...taskForm, budget: e.target.value })}
                        className="p-2 border rounded"
                        required
                      />
                      <button type="submit" className="col-span-2 bg-indigo-500 text-white p-2 rounded">
                        Create Task
                      </button>
                    </form>
                  </div>
                )}

                {/* Assign Task */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-bold mb-4">Assign Task</h2>
                  <form onSubmit={handleAssignTask} className="grid grid-cols-3 gap-4">
                    <select
                      value={assignmentForm.taskId}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, taskId: e.target.value })}
                      className="p-2 border rounded"
                      required
                    >
                      <option value="">-- Select Task --</option>
                      {selectedProject.phases?.map((phase) =>
                        phase.tasks?.map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.title} ({phase.name})
                          </option>
                        ))
                      )}
                    </select>
                    <select
                      value={assignmentForm.userId}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, userId: e.target.value })}
                      className="p-2 border rounded"
                      required
                    >
                      <option value="">-- Select User --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Hourly Rate"
                      value={assignmentForm.hourlyRate}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, hourlyRate: e.target.value })}
                      className="p-2 border rounded"
                      required
                    />
                    <button type="submit" className="col-span-3 bg-teal-500 text-white p-2 rounded">
                      Assign Task
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4">Select Project for Budget & Utilization</h2>
              <select
                onChange={(e) => {
                  const proj = projects.find((p) => p.id === e.target.value);
                  if (proj) {
                    setSelectedProject(proj);
                    loadBudgetAndUtilization(proj.id);
                  }
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {budget && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Budget Overview: {budget.name}</h2>
                
                {/* Project Level */}
                <div className="mb-6 p-4 bg-blue-50 rounded">
                  <h3 className="font-bold text-lg mb-2">Project Level</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Forecast Budget</p>
                      <p className="text-xl font-bold">${budget.forecastBudget.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Actual Cost</p>
                      <p className="text-xl font-bold text-orange-600">${budget.actualCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="text-xl font-bold text-green-600">${budget.remaining.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{
                        width: `${Math.min((budget.actualCost / budget.forecastBudget) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Phases */}
                {budget.phases.map((phase) => (
                  <div key={phase.phaseId} className="mb-4 p-4 bg-gray-50 rounded">
                    <h3 className="font-bold mb-2">{phase.name}</h3>
                    <div className="grid grid-cols-3 gap-4 mb-2 text-sm">
                      <div>Budget: ${phase.budget.toFixed(2)}</div>
                      <div>Actual: ${phase.actualCost.toFixed(2)}</div>
                      <div>Remaining: ${phase.remaining.toFixed(2)}</div>
                    </div>

                    {/* Tasks */}
                    <table className="w-full mt-2 text-sm">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="p-2 text-left">Task</th>
                          <th className="p-2 text-right">Budget</th>
                          <th className="p-2 text-right">Actual</th>
                          <th className="p-2 text-right">Remaining</th>
                          <th className="p-2 text-right">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phase.tasks.map((task) => (
                          <tr key={task.taskId} className="border-b">
                            <td className="p-2">{task.title}</td>
                            <td className="p-2 text-right">${task.budget.toFixed(2)}</td>
                            <td className="p-2 text-right">${task.actualCost.toFixed(2)}</td>
                            <td className="p-2 text-right">${task.remaining.toFixed(2)}</td>
                            <td className="p-2 text-right">{task.actualHours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {utilization.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Resource Utilization</h2>
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Role</th>
                      <th className="p-2 text-right">Forecast Hours</th>
                      <th className="p-2 text-right">Actual Hours</th>
                      <th className="p-2 text-right">Remaining</th>
                      <th className="p-2 text-right">Utilization %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilization.map((u) => (
                      <tr key={u.userId} className="border-b">
                        <td className="p-2">{u.userName}</td>
                        <td className="p-2">{u.roleName}</td>
                        <td className="p-2 text-right">{u.forecastHours}h</td>
                        <td className="p-2 text-right">{u.actualHours}h</td>
                        <td className="p-2 text-right">{u.remainingHours}h</td>
                        <td className="p-2 text-right">
                          <span
                            className={`font-bold ${
                              u.utilization > 100
                                ? 'text-red-600'
                                : u.utilization > 80
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}
                          >
                            {u.utilization.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Generate Invoice</h2>
            <form onSubmit={handleGenerateInvoice} className="grid grid-cols-3 gap-4">
              <select
                value={invoiceForm.projectId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, projectId: e.target.value })}
                className="p-2 border rounded"
                required
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Period Start"
                value={invoiceForm.periodStart}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, periodStart: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <input
                type="date"
                placeholder="Period End"
                value={invoiceForm.periodEnd}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, periodEnd: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <button type="submit" className="col-span-3 bg-green-500 text-white p-2 rounded">
                Generate Invoice
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}