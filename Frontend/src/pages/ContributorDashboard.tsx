import { useState, useEffect } from 'react';
import { getMyTasks, createTimeEntry, getTaskTimeEntries, deleteTimeEntry } from '../api/api';
import { useAuth } from '../contexts/authcontext';

// Remove local interfaces and import from API
import type { Task, TimeEntry } from '../api/api';

const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toFixed(2);
};

export default function ContributorDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [showTimeEntryForm, setShowTimeEntryForm] = useState(false);
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [timeEntryForm, setTimeEntryForm] = useState({
    date: getTodayDate(),
    hours: '',
    isBillable: true,
  });

  useEffect(() => {
    loadMyTasks();
  }, []);

  const loadMyTasks = async () => {
    try {
      const data = await getMyTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  };

  const loadTaskTimeEntries = async (taskId: string) => {
    try {
      const entries = await getTaskTimeEntries(taskId);
      setTimeEntries(entries);
    } catch (err) {
      console.error('Failed to load time entries', err);
    }
  };

  const handleSelectTask = async (task: Task) => {
    setSelectedTask(task);
    setShowTimeEntryForm(false);
    await loadTaskTimeEntries(task.id);
  };

  const handleCreateTimeEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await createTimeEntry({
        taskId: selectedTask.id,
        date: timeEntryForm.date,
        hours: parseFloat(timeEntryForm.hours),
        isBillable: timeEntryForm.isBillable,
      });

      setTimeEntryForm({
        date: getTodayDate(),
        hours: '',
        isBillable: true,
      });
      setShowTimeEntryForm(false);
      await loadTaskTimeEntries(selectedTask.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to log time');
    }
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    if (!confirm('Delete this time entry?')) return;

    try {
      await deleteTimeEntry(entryId);
      if (selectedTask) {
        await loadTaskTimeEntries(selectedTask.id);
      }
    } catch (err) {
      alert('Failed to delete time entry');
    }
  };

  const getMyRate = (task: Task): number => {
    const assignment = task.assignments?.find(a => a.userId === user?.id);
    return assignment ? assignment.hourlyRate : 0;
  };

  // FIX: Add proper type checking and default values
  const getTotalHours = (): number => {
    if (!timeEntries || timeEntries.length === 0) return 0;
    const total = timeEntries.reduce((sum, entry) => {
      const hours = typeof entry.hours === 'number' ? entry.hours : 0;
      return sum + hours;
    }, 0);
    return total || 0; // Ensure we always return a number
  };

  const getTotalCost = (): number => {
    if (!selectedTask) return 0;
    const rate = getMyRate(selectedTask);
    const hours = getTotalHours();
    return hours * rate;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-gray-600">Tasks assigned to you</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task List */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Assigned Tasks</h2>
            
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks assigned yet</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`p-4 border rounded cursor-pointer transition ${
                      selectedTask?.id === task.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {task.phase?.name}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                        {task.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Your Rate: ${formatCurrency(getMyRate(task))}/hr
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time Entry Section */}
          <div className="bg-white rounded shadow p-6">
            {!selectedTask ? (
              <div className="text-center py-16 text-gray-500">
                <p>Select a task to log time</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{selectedTask.title}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedTask.phase?.name}
                  </p>
                </div>

                {!showTimeEntryForm ? (
                  <button
                    onClick={() => setShowTimeEntryForm(true)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
                  >
                    + Log Time
                  </button>
                ) : (
                  <form onSubmit={handleCreateTimeEntry} className="mb-4 p-4 bg-gray-50 rounded border">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date *</label>
                        <input
                          type="date"
                          value={timeEntryForm.date}
                          onChange={(e) => setTimeEntryForm({ ...timeEntryForm, date: e.target.value })}
                          required
                          max={getTodayDate()}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Hours *</label>
                        <input
                          type="number"
                          step="0.25"
                          min="0.25"
                          max="24"
                          value={timeEntryForm.hours}
                          onChange={(e) => setTimeEntryForm({ ...timeEntryForm, hours: e.target.value })}
                          required
                          placeholder="8.0"
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isBillable"
                          checked={timeEntryForm.isBillable}
                          onChange={(e) => setTimeEntryForm({ ...timeEntryForm, isBillable: e.target.checked })}
                          className="mr-2"
                        />
                        <label htmlFor="isBillable" className="text-sm">Billable</label>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowTimeEntryForm(false)}
                        className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Log Time
                      </button>
                    </div>
                  </form>
                )}

                {/* Time Entries List */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Time Logged</h3>
                    <div className="text-sm text-gray-600">
                      Total: {getTotalHours().toFixed(2)}h (${formatCurrency(getTotalCost())})
                    </div>
                  </div>

                  {timeEntries.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No time logged yet</p>
                  ) : (
                    <div className="space-y-2">
                      {timeEntries.map((entry) => (
                        <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-600">
                              {typeof entry.hours === 'number' ? entry.hours.toFixed(2) : '0.00'}h • {entry.isBillable ? '💰 Billable' : '📝 Non-billable'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTimeEntry(entry.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}