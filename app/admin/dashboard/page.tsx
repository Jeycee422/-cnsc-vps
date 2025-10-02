'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { 
  MotorcycleIcon,
  BicycleIcon,
  CarIcon,
  TruckIcon,
  EvIcon,
  TricycleIcon,
  SuvIcon,
  PickupIcon,
  GenericVehicleIcon
} from '../../icons';
import { ref, onValue, off, query, limitToLast, orderByChild } from 'firebase/database';
import { db } from '@/lib/firebase-client';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

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
  const [realTimeScans, setRealTimeScans] = useState<any[]>([]);
  const [realTimeStats, setRealTimeStats] = useState({
    success: 0,
    denied: 0,
    error: 0,
    total: 0
  });

  // Real-time Firebase listener for RFID scans
  useEffect(() => {
    const scansRef = query(
      ref(db, 'rfidScanLogs'),
      orderByChild('loggedAt'),
      limitToLast(50) // Last 50 scans
    );

    const unsubscribe = onValue(scansRef, (snapshot) => {
      const scansData: any[] = [];
      let successCount = 0;
      let deniedCount = 0;
      let errorCount = 0;

      snapshot.forEach((childSnapshot) => {
        const scan = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };
        scansData.push(scan);

        // Count stats
        if (scan.scanResult === 'success') successCount++;
        else if (scan.scanResult === 'denied') deniedCount++;
        else if (scan.scanResult === 'error') errorCount++;
      });

      // Reverse to show newest first
      setRealTimeScans(scansData.reverse());
      setRealTimeStats({
        success: successCount,
        denied: deniedCount,
        error: errorCount,
        total: scansData.length
      });
    });

    // Cleanup subscription on unmount
    return () => {
      off(scansRef, 'value', unsubscribe);
    };
  }, []);

  const renderVehicleIcon = (vehicleTypeRaw: string) => {
    const t = (vehicleTypeRaw || '').toLowerCase();
    if (t === 'motorcycle' || t.includes('motor')) {
      return <MotorcycleIcon />;
    }
    if (t === 'bicycle' || t.includes('bike')) {
      return <BicycleIcon />;
    }
    if (t === 'e_vehicle' || t.includes('e-vehicle') || t.includes('ev') || t.includes('electric')) {
      return <EvIcon />;
    }
    if (t === 'heavy_truck' || t === 'heavy_equipment' || t.includes('truck') || t.includes('heavy')) {
      return <TruckIcon />;
    }
    if (t === 'tricycle' || t.includes('trike')) {
      return <TricycleIcon />;
    }
    if (t === 'suv') {
      return <SuvIcon />;
    }
    if (t === 'car' || t.includes('sedan') || t.includes('hatch') || t.includes('van')) {
      return <CarIcon />;
    }
    if (t === 'double_cab' || t === 'single_cab') {
      return <PickupIcon />;
    }
    // Default generic vehicle
    return <GenericVehicleIcon />;
  };

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

  // Charts data
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

  // Real-time scan stats data
  const scanStatsData = {
    labels: ['Successful', 'Denied', 'Errors'],
    datasets: [
      {
        data: [
          realTimeStats.success,
          realTimeStats.denied,
          realTimeStats.error,
        ],
        backgroundColor: [
          '#34D399',
          '#F87171',
          '#FCD34D',
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Application Status</h2>
          <div className="h-80">
            <Doughnut
              data={statusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Real-time Scan Stats Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Real-time Scan Stats 
            <span className="ml-2 inline-flex h-3 w-3 rounded-full bg-green-400 animate-pulse"></span>
          </h2>
          <div className="h-80">
            <Doughnut
              data={scanStatsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="text-green-600">
              <div className="text-2xl font-bold">{realTimeStats.success}</div>
              <div className="text-sm">Successful</div>
            </div>
            <div className="text-red-600">
              <div className="text-2xl font-bold">{realTimeStats.denied}</div>
              <div className="text-sm">Denied</div>
            </div>
            <div className="text-yellow-600">
              <div className="text-2xl font-bold">{realTimeStats.error}</div>
              <div className="text-sm">Errors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans (Real-time from Firebase) */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Recent RFID Scans 
            <span className="ml-2 text-sm font-normal text-green-600">• Live Updates</span>
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {realTimeScans.map((scan, index) => {
            const statusColor = scan.scanResult === 'success' ? 'text-green-600 bg-green-50' : 
                              scan.scanResult === 'denied' ? 'text-red-600 bg-red-50' : 
                              'text-yellow-600 bg-yellow-50';
            const vehicleType = scan.vehicle?.vehicleType || '';
            const icon = renderVehicleIcon(vehicleType);
            
            return (
              <div key={scan.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full shadow bg-[#7E0303]">
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {scan.vehicle?.plateNumber || 'Unknown Plate'}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                          {scan.scanResult.toUpperCase()}
                        </span>
                        {vehicleType && (
                          <span className="text-xs text-gray-500 px-2 py-0.5 border border-gray-200 rounded">
                            {vehicleType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Tag: {scan.tagId} • {scan.scanMessage}
                      </p>
                      {scan.vehicle?.driverName && (
                        <p className="text-xs text-gray-400">Driver: {scan.vehicle.driverName}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500 block">
                      {new Date(scan.scanTimestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(scan.scanTimestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {realTimeScans.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No RFID scan data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}