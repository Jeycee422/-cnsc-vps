'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  role: string;
  name: string;
}

interface VehiclePass {
  id: string;
  status: 'pending' | 'approved' | 'registered' | 'rejected' | 'expired';
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
  vehicleInfo?: {
    type?: string;
    plateNumber?: string;
  };
  vehicleDetails?: {
    type?: string;
    plateNumber?: string;
    brand?: string;
    model?: string;
    color?: string;
    year?: string;
  };
}

export default function VehiclePass() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [passes, setPasses] = useState<VehiclePass[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [formData, setFormData] = useState({
    vehicleType: '',
    plateNumber: '',
    brand: '',
    model: '',
    color: '',
    year: '',
    purpose: '',
    duration: 'permanent',
    startDate: '',
    endDate: ''
  });

  const token = useMemo(() => (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', []);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    // Authenticate via token + /api/auth/me instead of relying on localStorage 'user'
    const ac = new AbortController();
    const checkAuth = async () => {
      const t = (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '';
      if (!t) {
        router.push('/signin');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
          signal: ac.signal,
        });
        if (!res.ok) {
          // Only redirect on explicit auth failures
          if (res.status === 401 || res.status === 403) {
            router.push('/signin');
            return;
          }
          const text = await res.text();
          setErrorMessage(text || 'Failed to verify authentication');
          setUser(null);
          return;
        }
        const data = await res.json();
        const u = data.user || data;
        const composedUser: User = {
          email: u.email || '',
          role: u.role || u.userType || '',
          name: [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') || u.name || '',
        };
        setUser(composedUser);
        if (composedUser.role === 'admin' || composedUser.role === 'super_admin') {
          router.push('/admin/dashboard');
          return;
        }
      } catch (err) {
        // Ignore aborts
        if (err && typeof err === 'object' && (err as any).name === 'AbortError') {
          return;
        }
        const msg = err instanceof Error ? err.message : 'Authentication check failed';
        setErrorMessage(msg);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
    return () => ac.abort();
  }, [API_BASE, router]);

  useEffect(() => {
    const ac = new AbortController();
    const load = async () => {
      if (!token) {
        setIsLoading(false);
        setErrorMessage('Not authenticated');
        return;
      }
      setIsLoading(true);
      setErrorMessage('');
      try {
        // Fetch user's passes/applications
        const res = await fetch(`${API_BASE}/api/vehicle-passes/my-applications`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          signal: ac.signal,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load passes');
        }
        const data = await res.json();
        const list: VehiclePass[] = data.passes || data.applications || [];
        setPasses(list);
      } catch (err) {
        if (err && typeof err === 'object' && (err as any).name === 'AbortError') {
          return;
        }
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => ac.abort();
  }, [API_BASE, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form and hide registration form
    setFormData({
      vehicleType: '',
      plateNumber: '',
      brand: '',
      model: '',
      color: '',
      year: '',
      purpose: '',
      duration: 'permanent',
      startDate: '',
      endDate: ''
    });
    setShowRegistrationForm(false);
  };

  const getVehicleTypeLabel = (value?: string) => {
    switch (value) {
      case 'motorcycle': return 'Motorcycle';
      case 'car': return 'Car';
      case 'suv': return 'SUV';
      case 'tricycle': return 'Tricycle';
      case 'double_cab': return 'Double Cab';
      case 'single_cab': return 'Single Cab';
      case 'heavy_truck': return 'Heavy Truck';
      case 'heavy_equipment': return 'Heavy Equipment';
      case 'bicycle': return 'Bicycle';
      case 'e_vehicle': return 'E-Vehicle';
      default: return value || '—';
    }
  };

  if (!authChecked) return <div className="bg-white rounded-lg shadow p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Vehicle Pass</h1>
          <p className="text-gray-600">Manage your vehicle pass and registration</p>
        </div>
        {passes.length === 0 && (
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
          >
            Register New Vehicle
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">Loading...</div>
      ) : errorMessage ? (
        <div className="bg-white rounded-lg shadow p-6 text-red-600">{errorMessage}</div>
      ) : passes.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {passes.map((p) => {
                    const vehType = p.vehicleInfo?.type || p.vehicleDetails?.type || '';
                    const plate = p.vehicleInfo?.plateNumber || p.vehicleDetails?.plateNumber || '';
                    const displayStatus = p.status === 'registered' ? 'active' : p.status;
                    const statusColor = displayStatus === 'active'
                      ? 'bg-green-100 text-green-800'
                      : displayStatus === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : displayStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : displayStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-sm text-gray-900">{getVehicleTypeLabel(vehType)}</div>
                          <div className="text-sm text-gray-500">{plate || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : showRegistrationForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Register New Vehicle</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                >
                    <option value="">Select type</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                    <option value="suv">SUV</option>
                    <option value="tricycle">Tricycle</option>
                    <option value="double_cab">Double Cab</option>
                    <option value="single_cab">Single Cab</option>
                    <option value="heavy_truck">Heavy Truck</option>
                    <option value="heavy_equipment">Heavy Equipment</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="e_vehicle">E-Vehicle</option>
                </select>
              </div>

              <div>
                <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700">Plate Number</label>
                <input
                  type="text"
                  id="plateNumber"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="text"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Purpose</label>
              <textarea
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration</label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
              >
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            {formData.duration === 'temporary' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 space-y-4">
              <button
                type="button"
                onClick={() => setShowRegistrationForm(false)}
                className="px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
              >
                Submit Registration
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">No Active Vehicle Pass</h2>
          <p className="text-gray-600 mb-6">You don't have an active vehicle pass. Register your vehicle to get started.</p>
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
          >
            Register New Vehicle
          </button>
        </div>
      )}
    </div>
  );
} 