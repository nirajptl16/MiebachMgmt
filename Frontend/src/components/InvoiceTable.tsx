import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client'; 

type InvoiceLineItem = {
  taskTitle: string;
  phaseName: string;
  hours: number;
  hourlyRate: number;
  amount: number;
};

type Invoice = {
  lineItems: InvoiceLineItem[];
  totalAmount: number;
};

interface InvoiceTableProps {
  defaultProjectId?: string;
  defaultClientId?: string;
}

function InvoiceTable({ defaultProjectId = '', defaultClientId = '' }: InvoiceTableProps) {
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [clientId, setClientId] = useState(defaultClientId);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProjectId(defaultProjectId);
  }, [defaultProjectId]);
  useEffect(() => {
    setClientId(defaultClientId);
  }, [defaultClientId]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!projectId || !clientId || !periodStart || !periodEnd) {
        setError('Please fill all fields.');
        setLoading(false);
        return;
      }
      const res = await apiClient.post('/invoices/generate', {
        projectId,
        clientId,
        periodStart,
        periodEnd,
      });
      setInvoice(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch invoice');
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Invoice Generator</h2>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 w-full bg-gray-100 cursor-not-allowed"
            placeholder="Project ID"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            disabled
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 w-full bg-gray-100 cursor-not-allowed"
            placeholder="Client ID"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            value={periodStart}
            onChange={e => setPeriodStart(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            value={periodEnd}
            onChange={e => setPeriodEnd(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchInvoice}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </div>
      {error && <div className="text-red-600 mb-4 text-center font-semibold">{error}</div>}

      {invoice && (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-blue-100">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Task</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Phase</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Hours</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Rate</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx} className="even:bg-gray-50 odd:bg-white">
                  <td className="px-4 py-2">{item.taskTitle}</td>
                  <td className="px-4 py-2">{item.phaseName}</td>
                  <td className="px-4 py-2 text-right">{item.hours}</td>
                  <td className="px-4 py-2 text-right">${item.hourlyRate.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-medium">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-bold bg-blue-50 border-t border-gray-300">Total</td>
                <td className="px-4 py-3 text-right font-extrabold bg-blue-50 border-t border-gray-300 text-blue-700">${invoice.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InvoiceTable;