'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  role: string;
  name: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const token = useMemo(() => (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', []);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
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
          name: [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') || u.name || 'User',
        };
        setUser(composedUser);
        // Redirect admins to admin dashboard to avoid admin context in user pages
        if (composedUser.role === 'admin' || composedUser.role === 'super_admin') {
          router.push('/admin/dashboard');
          return;
        }
      } catch (err) {
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
    if (!token) return;
    const ac = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const res = await fetch(`${API_BASE}/api/vehicle-passes/my-applications`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load applications');
        }
        const data = await res.json();
        setApplications(data.applications || []);
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
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.name || 'User'}</h1>
          <p className="text-gray-600">Here's an overview of your vehicle pass</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            router.push('/signin');
          }}
          className="px-4 py-2 text-[#7E0303] border-2 border-[#7E0303] rounded-md hover:bg-[#7E0303] hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Vehicle Pass Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">My Vehicle Passes ({applications.length})</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : errorMessage ? (
          <div className="text-red-600">{errorMessage}</div>
        ) : applications.length === 0 ? (
          <div className="text-gray-600">No applications yet. Head to Online Application to submit one.</div>
        ) : (
          <div className="space-y-4">
            {applications.map((application, index) => {
              const displayStatus = application.status === 'registered' ? 'Active' : application.status.charAt(0).toUpperCase() + application.status.slice(1);
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'registered':
                  case 'completed':
                    return 'bg-green-100 text-green-800 border-green-200';
                  case 'approved':
                    return 'bg-blue-100 text-blue-800 border-blue-200';
                  case 'pending':
                    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  case 'rejected':
                    return 'bg-red-100 text-red-800 border-red-200';
                  default:
                    return 'bg-gray-100 text-gray-800 border-gray-200';
                }
              };
              
              return (
                <div key={application._id || index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#7E0303] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      Vehicle Pass #{index + 1}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(application.status)}`}>
                      {displayStatus}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Vehicle Details</h4>
                      <p className="text-sm text-gray-600">
                        {getVehicleTypeLabel(application.vehicleInfo?.type)} - {application.vehicleInfo?.plateNumber || '—'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">RFID Tag</h4>
                      <p className="text-sm text-gray-600">
                        {application.rfidInfo?.tagId ? (
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {application.rfidInfo.tagId}
                          </span>
                        ) : (
                          'Not assigned'
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Expiry Date</h4>
                      <p className="text-sm text-gray-600">
                        {application.expiryDate ? new Date(application.expiryDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Submitted: {new Date(application.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(application.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 border-2 border-gray-200 rounded-lg text-left hover:border-[#7E0303] transition-colors" onClick={() => router.push('/user/pass')}>
            <h3 className="font-medium text-gray-900">Renew Vehicle Pass</h3>
            <p className="text-gray-600">Extend your vehicle pass validity</p>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg text-left hover:border-[#7E0303] transition-colors" onClick={() => router.push('/user/pass')}>
            <h3 className="font-medium text-gray-900">Update Vehicle Details</h3>
            <p className="text-gray-600">Modify your vehicle information</p>
          </button>
          {/* History action removed */}
          <button className="p-4 border-2 border-gray-200 rounded-lg text-left hover:border-[#7E0303] transition-colors" onClick={() => router.push('/user/online_registration')}>
            <h3 className="font-medium text-gray-900">Online Application</h3>
            <p className="text-gray-600">Submit or update your application</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            {
              action: 'Pass Renewed',
              date: 'March 15, 2024',
              status: 'Completed'
            },
            {
              action: 'Vehicle Details Updated',
              date: 'March 10, 2024',
              status: 'Completed'
            },
            {
              action: 'New Pass Issued',
              date: 'January 1, 2024',
              status: 'Completed'
            }
          ].map((activity, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.date}</p>
                </div>
                <span className="text-sm text-green-600">{activity.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 