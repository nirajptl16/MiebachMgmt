import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client'; // ✅ import your axios instance

interface TaskBudget {
  forecast: number;
  actual: number;
  remaining: number;
}

const TaskBudget: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [budget, setBudget] = useState<TaskBudget | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const res = await apiClient.get(`/time-entries/task/${taskId}/budget`);
        setBudget(res.data);
      } catch (err) {
        console.error('Failed to load budget:', err);
        setError('Failed to load budget');
      }
    };

    loadBudget();
  }, [taskId]);

  if (error) return <span style={{ color: 'red' }}>{error}</span>;
  if (!budget) return <span>Loading...</span>;

  return (
    <span className="ml-2 text-xs text-gray-600">
      Budget: ${budget.forecast} | Actual: ${budget.actual} | Remaining: ${budget.remaining}
    </span>
  );
};

export default TaskBudget;
