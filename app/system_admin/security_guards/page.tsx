'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Guard {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: 'security_guard';
}

export default function SecurityGuardsPage() {
  const token = useMemo(() => (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', []);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guard | null>(null);
  const [form, setForm] = useState<{ firstName: string; middleName?: string; lastName: string; email: string; phoneNumber: string; address: string; password: string; role: 'security_guard'; }>({ firstName: '', middleName: '', lastName: '', email: '', phoneNumber: '', address: '', password: '', role: 'security_guard' });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const url = new URL(`${API_BASE}/api/system-admin/users`);
      url.searchParams.set('role', 'security_guard');
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGuards((data.users || data.guards || []).filter((u: any) => u.role === 'security_guard'));
    } catch (e: any) {
      setError(e?.message || 'Failed to load guards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const openCreate = () => { setEditing(null); setForm({ firstName: '', middleName: '', lastName: '', email: '', phoneNumber: '', address: '', password: '', role: 'security_guard' }); setModalOpen(true); };
  const openEdit = (g: Guard) => { setEditing(g); setForm({ firstName: g.firstName, middleName: g.middleName || '', lastName: g.lastName, email: g.email, phoneNumber: g.phoneNumber || '', address: g.address || '', password: '', role: 'security_guard' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); };

  const save = async () => {
    try {
      const url = editing ? `${API_BASE}/api/system-admin/users/${editing._id}` : `${API_BASE}/api/system-admin/users`;
      const method = editing ? 'PUT' : 'POST';
      const payload: any = { ...form };
      if (editing && !payload.password) { delete payload.password; }
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      await load();
      closeModal();
    } catch (e: any) {
      alert(e?.message || 'Save failed');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this guard?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/system-admin/users/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      alert(e?.message || 'Delete failed');
    }
  };

  const filtered = guards.filter(g => (
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(query.toLowerCase()) ||
    (g.phoneNumber || '').toLowerCase().includes(query.toLowerCase())
  ));

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Security Guards</h1>
        <button onClick={openCreate} className="bg-[#7E0303] text-white px-4 py-2 rounded-md hover:bg-[#5E0202]">New Guard</button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, email, phone" className="w-full border px-3 py-2 rounded" />
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(g => (
                <tr key={g._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{g.firstName} {g.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{g.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{g.phoneNumber || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{g.address || '—'}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(g)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
                      <button onClick={() => remove(g._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Guard' : 'New Guard'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">First Name</label>
                <input className="w-full border px-3 py-2 rounded" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Middle Name</label>
                <input className="w-full border px-3 py-2 rounded" value={form.middleName || ''} onChange={e => setForm({ ...form, middleName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Last Name</label>
                <input className="w-full border px-3 py-2 rounded" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full border px-3 py-2 rounded" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone Number</label>
                <input className="w-full border px-3 py-2 rounded" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Address</label>
                <input className="w-full border px-3 py-2 rounded" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password {editing && <span className="text-gray-500 text-xs">(leave blank to keep)</span>}</label>
                <input type="password" className="w-full border px-3 py-2 rounded" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancel</button>
              <button onClick={save} className="px-4 py-2 rounded bg-[#7E0303] text-white hover:bg-[#5E0202]">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


