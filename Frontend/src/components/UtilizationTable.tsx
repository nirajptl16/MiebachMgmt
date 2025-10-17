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

  if (error) return <div className="text-red-500">{error}</div>;
  if (!data.length) return <div className="text-gray-400">Loading utilization...</div>;

  return (
    <div className="my-4">
      <h3 className="font-semibold text-lg mb-3 text-gray-800">Resource Utilization</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-sm text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Role</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Staffed Hours</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Actual Logged</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Utilization %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.userId} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                <td className="px-4 py-2">{row.userName}</td>
                <td className="px-4 py-2">{row.roleName}</td>
                <td className="px-4 py-2 text-right">{row.forecastHours}</td>
                <td className="px-4 py-2 text-right">{row.actualHours}</td>
                <td className="px-4 py-2 text-right font-semibold">
                  <span className={row.utilization >= 100 ? "text-green-600" : row.utilization >= 80 ? "text-yellow-600" : "text-red-600"}>
                    {row.utilization.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UtilizationTable;
