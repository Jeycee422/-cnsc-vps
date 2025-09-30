'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stats, setStats] = useState<{
    users: { total: number };
    vehicles: { total: number; pending: number; approved: number; rejected: number; completed: number };
    scans: { total: number; successful: number; denied: number };
  } | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
        
        if (!token) {
          throw new Error('Not authenticated');
        }
  
        // Add cache-busting to prevent 304 responses
        const timestamp = new Date().getTime();
        const res = await fetch(`${API_BASE}/api/admin/dashboard?t=${timestamp}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          cache: 'no-store'
        });
        
        console.log('Response status:', res.status);
        
        if (!res.ok) {
          const text = await res.text();
          console.log('Error response:', text);
          throw new Error(text || `HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Data received:', data);
        
        if (isMounted) {
          // Check if data exists before setting state
          if (data && data.statistics) {
            const stats = {
              ...data.statistics,
              vehicles: {
                ...data.statistics.vehicles,
                completed: data.statistics.vehicles.completed || 0
              }
            };
            setStats(stats);
            setRecentScans(data.recentActivity?.scans || []);
            setRecentUsers(data.recentActivity?.users || []);
          } else {
            setErrorMessage('No data received from server');
          }
        }
      } catch (err: unknown) {
        console.error('Error in dashboard load:', err);
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setErrorMessage(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
  
    load();
  
    return () => {
      isMounted = false;
    };
  }, []);

  // Mock data for charts
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Applications',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: '#7E0303',
        backgroundColor: 'rgba(126, 3, 3, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const vehicleTypeData = {
    labels: ['Car', 'Motorcycle', 'Other'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [
          '#7E0303',
          '#FFA07A',
          '#98FB98',
        ],
      },
    ],
  };

  const statusData = {
    labels: ['Pending', 'Approved', 'Completed', 'Rejected'],
    datasets: [
      {
        data: [
          stats?.vehicles.pending ?? 0,
          stats?.vehicles.approved ?? 0,
          stats?.vehicles.completed ?? 0,
          stats?.vehicles.rejected ?? 0,
        ],
        backgroundColor: [
          '#FCD34D',
          '#3B82F6',
          '#34D399',
          '#F87171',
        ],
      },
    ],
  };

  const userTypeData = {
    labels: ['Students', 'Faculty', 'Staff', 'Visitors'],
    datasets: [
      {
        data: [45, 30, 20, 5],
        backgroundColor: [
          '#7E0303',
          '#FFA07A',
          '#98FB98',
          '#87CEEB',
        ],
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div>Loading...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="text-red-600">{errorMessage}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[#7E0303] bg-opacity-10">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Pending Applications</h2>
              <p className="text-2xl font-semibold text-gray-900">{stats?.vehicles.pending ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[#7E0303] bg-opacity-10">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Approved Applications</h2>
              <p className="text-2xl font-semibold text-gray-900">{stats?.vehicles.approved ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting RFID assignment</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[#7E0303] bg-opacity-10">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Completed Applications</h2>
              <p className="text-2xl font-semibold text-gray-900">{stats?.vehicles.completed ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">With RFID assigned</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[#7E0303] bg-opacity-10">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Total Users</h2>
              <p className="text-2xl font-semibold text-gray-900">{stats?.users.total ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
            </div>
          </div>
        </div>

      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Application & Registration Status</h2>
          <div className="h-80">
            <Doughnut
              data={statusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right' as const,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Applications Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Applications</h2>
          <div className="h-80">
            <Line
              data={monthlyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Vehicle Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Type Distribution</h2>
          <div className="h-80">
            <Doughnut
              data={vehicleTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right' as const,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* User Type Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">User Type Distribution</h2>
        <div className="h-80">
          <Bar
            data={userTypeData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: (value) => `${value}%`
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentScans.map((scan, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-[#7E0303] bg-opacity-10">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{scan.scanResult === 'success' ? 'Scan Success' : scan.scanResult === 'denied' ? 'Scan Denied' : 'Scan'}</p>
                    <p className="text-sm text-gray-500">{scan.user?.firstName} {scan.user?.lastName} - Plate: {scan.vehicle?.vehicleInfo?.plateNumber || scan.vehicle?.plateNumber || 'N/A'}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{new Date(scan.scanTimestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 