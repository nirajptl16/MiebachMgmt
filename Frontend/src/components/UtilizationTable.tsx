import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client'; // ✅ import your Axios instance

interface UtilizationRow {
  userId: string;
  userName: string;
  roleName: string;
  forecastHours: number;
  actualHours: number;
  utilization: number;
}

const UtilizationTable: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [data, setData] = useState<UtilizationRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUtilization = async () => {
      try {
        console.log('Fetching utilization for project:', projectId);

        const res = await apiClient.get(`/projects/${projectId}/utilization`); // ✅ uses token automatically

        console.log('Utilization data received:', res.data);
        setData(res.data);
      } catch (err: any) {
        console.error('Error loading utilization:', err);
        setError('Failed to load utilization');
      }
    };

    loadUtilization();
  }, [projectId]);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!data.length) return <div>Loading utilization...</div>;

  return (
    <div className="my-4">
      <h3 className="font-semibold mb-2">Resource Utilization</h3>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Role</th>
            <th className="border px-2 py-1">Staffed Hours</th>
            <th className="border px-2 py-1">Actual Logged Hours</th>
            <th className="border px-2 py-1">Utilization %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.userId}>
              <td className="border px-2 py-1">{row.userName}</td>
              <td className="border px-2 py-1">{row.roleName}</td>
              <td className="border px-2 py-1">{row.forecastHours}</td>
              <td className="border px-2 py-1">{row.actualHours}</td>
              <td className="border px-2 py-1">{row.utilization.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UtilizationTable;
