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
    <div className="bg-white rounded-lg shadow p-4 max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 flex-1 bg-gray-100"
          placeholder="Project ID"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          disabled
        />
        <input
          className="border rounded px-2 py-1 flex-1 bg-gray-100"
          placeholder="Client ID"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          disabled
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={periodStart}
          onChange={e => setPeriodStart(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={periodEnd}
          onChange={e => setPeriodEnd(e.target.value)}
        />
        <button
          onClick={fetchInvoice}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          {loading ? 'Generating...' : 'Generate Invoice'}
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}

      {invoice && (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-3 py-2 text-left">Task</th>
                <th className="px-3 py-2 text-left">Phase</th>
                <th className="px-3 py-2 text-right">Hours</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td className="px-3 py-2">{item.taskTitle}</td>
                  <td className="px-3 py-2">{item.phaseName}</td>
                  <td className="px-3 py-2 text-right">{item.hours}</td>
                  <td className="px-3 py-2 text-right">{item.hourlyRate}</td>
                  <td className="px-3 py-2 text-right">{item.amount}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="px-3 py-2 text-right font-semibold">Total</td>
                <td className="px-3 py-2 text-right font-bold">{invoice.totalAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InvoiceTable;