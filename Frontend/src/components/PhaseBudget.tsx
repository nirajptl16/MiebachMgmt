import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

interface PhaseBudget {
  budget: number;
  consumed: number;
  remaining: number;
}

const PhaseBudget: React.FC<{ phaseId: string }> = ({ phaseId }) => {
  const [budget, setBudget] = useState<PhaseBudget | null>(null);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadBudget = async () => {
    try {
      const res = await apiClient.get(`/time-entries/phase/${phaseId}/budget`);
      const api = res.data;
      setBudget({
        budget: api.forecast ?? api.budget,
        consumed: api.actual ?? api.consumed,
        remaining: api.remaining,
      });
    } catch (err) {
      setError('Failed to load phase budget');
    }
  };
  loadBudget();
}, [phaseId]);

  if (error) return <span style={{ color: 'red' }}>{error}</span>;
  if (!budget) return <span>Loading...</span>;

  return (
    <span className="ml-2 text-xs text-black font-bold">
      Phase Budget: ${budget.budget} | Consumed: ${budget.consumed}
    </span>
  );
};

export default PhaseBudget;