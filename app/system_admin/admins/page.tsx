'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type AdminRole = 'admin' | 'super_admin';

interface AdminUser {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: AdminRole;
}

export default function AdminsPage() {
  const token = useMemo(() => (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', []);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<{ firstName: string; middleName?: string; lastName: string; email: string; phoneNumber: string; address: string; password: string; role: AdminRole; }>({ firstName: '', middleName: '', lastName: '', email: '', phoneNumber: '', address: '', password: '', role: 'admin' });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Simply fetch all users and filter for admin roles on frontend
      const res = await fetch(`${API_BASE}/api/system-admin/users`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const all = (data.users || data.admins || []).filter((u: any) => 
        u.role === 'admin' || u.role === 'super_admin'
      );
      setAdmins(all);
    } catch (e: any) {
      setError(e?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const openCreate = () => { setEditing(null); setForm({ firstName: '', middleName: '', lastName: '', email: '', phoneNumber: '', address: '', password: '', role: 'admin' }); setModalOpen(true); };
  const openEdit = (a: AdminUser) => { setEditing(a); setForm({ firstName: a.firstName, middleName: a.middleName || '', lastName: a.lastName, email: a.email, phoneNumber: a.phoneNumber || '', address: a.address || '', password: '', role: a.role }); setModalOpen(true); };
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
    if (!confirm('Delete this admin account?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/system-admin/users/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      alert(e?.message || 'Delete failed');
    }
  };

  const filtered = admins.filter(a => (
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(query.toLowerCase()) ||
    (a.role || '').toLowerCase().includes(query.toLowerCase())
  ));

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Accounts</h1>
        <button onClick={openCreate} className="bg-[#7E0303] text-white px-4 py-2 rounded-md hover:bg-[#5E0202]">New Admin</button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, email, role" className="w-full border px-3 py-2 rounded" />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(a => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{a.firstName} {a.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{a.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{a.phoneNumber || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{a.address || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">{a.role}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(a)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
                      <button onClick={() => remove(a._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
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
              <h2 className="text-lg font-semibold">{editing ? 'Edit Admin' : 'New Admin'}</h2>
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
              <div>
                <label className="block text-sm text-gray-700 mb-1">Role</label>
                <select className="w-full border px-3 py-2 rounded" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as AdminRole })}>
                  <option value="admin">admin</option>
                  <option value="super_admin">super_admin</option>
                </select>
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


