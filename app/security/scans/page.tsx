'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off, query, limitToLast, orderByChild } from 'firebase/database';
import { db } from '@/lib/firebase-client';
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
} from '@/app/icons';

export default function SecurityScans() {
  const [realTimeScans, setRealTimeScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function for date display with expiration check
  const formatValidUntil = (validUntilString: string) => {
    if (!validUntilString) return null;
    
    try {
      const date = new Date(validUntilString);
      // Check if the date is valid
      if (isNaN(date.getTime())) return null;
      
      const now = new Date();
      const isExpired = date < now;
      const isExpiringSoon = date < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      return {
        display: date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        isExpired,
        isExpiringSoon: !isExpired && isExpiringSoon,
        color: isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-500'
      };
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  // Real-time Firebase listener for RFID scans
  useEffect(() => {
    const scansRef = query(
      ref(db, 'rfidScanLogs'),
      orderByChild('loggedAt'),
      limitToLast(100) // Last 100 scans
    );

    const unsubscribe = onValue(scansRef, (snapshot) => {
      const scansData: any[] = [];

      snapshot.forEach((childSnapshot) => {
        const scan = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };
        scansData.push(scan);
      });

      // Reverse to show newest first
      setRealTimeScans(scansData.reverse());
      setIsLoading(false);
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

  const getVehicleTypeLabel = (vehicleType: string) => {
    switch (vehicleType?.toLowerCase()) {
      case 'motorcycle': return 'Motorcycle';
      case 'bicycle': return 'Bicycle';
      case 'car': return 'Car';
      case 'suv': return 'SUV';
      case 'tricycle': return 'Tricycle';
      case 'heavy_truck': return 'Heavy Truck';
      case 'heavy_equipment': return 'Heavy Equipment';
      case 'e_vehicle': return 'E-Vehicle';
      case 'double_cab': return 'Double Cab';
      case 'single_cab': return 'Single Cab';
      default: return vehicleType || 'Vehicle';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">RFID Scans</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center text-gray-500">Loading scans...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">RFID Scans</h1>
        <div className="flex items-center space-x-2">
          <span className="inline-flex h-3 w-3 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-sm text-gray-600">Live Updates</span>
        </div>
      </div>

      {/* Scans List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Recent Vehicle Scans
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {realTimeScans.map((scan, index) => {
            const statusColor = scan.scanResult === 'success' ? 'text-green-600 bg-green-50' : 
                              scan.scanResult === 'denied' ? 'text-red-600 bg-red-50' : 
                              'text-yellow-600 bg-yellow-50';
            const vehicleType = scan.vehicle?.vehicleType || '';
            const icon = renderVehicleIcon(vehicleType);
            
            // Get validUntil information with proper formatting
            const validUntilInfo = formatValidUntil(scan.rfidValidity?.validUntil);
            
            return (
              <div key={scan.id || index} className="px-6 py-4">
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
                            {getVehicleTypeLabel(vehicleType)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {scan.scanMessage}
                      </p>
                      {scan.vehicle?.driverName && (
                        <p className="text-xs text-gray-500">Driver: {scan.vehicle.driverName}</p>
                      )}
                      
                      {/* RFID Status Information */}
                      <div className="flex items-center space-x-4 mt-1">
                        {scan.rfidValidity?.isActive !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            scan.rfidValidity.isActive 
                              ? 'text-green-700 bg-green-100' 
                              : 'text-red-700 bg-red-100'
                          }`}>
                            RFID: {scan.rfidValidity.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                        
                        {validUntilInfo && (
                          <span className={`text-xs px-2 py-0.5 rounded ${validUntilInfo.color} bg-gray-100`}>
                            Valid Until: {validUntilInfo.display}
                            {validUntilInfo.isExpired && ' (Expired)'}
                            {validUntilInfo.isExpiringSoon && ' (Expiring Soon)'}
                          </span>
                        )}
                      </div>
                      
                      {/* Assigned Date if available */}
                      {scan.rfidValidity?.assignedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Assigned: {new Date(scan.rfidValidity.assignedAt).toLocaleDateString()}
                        </p>
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
                    {scan.responseTime && (
                      <span className="text-xs text-gray-400 block mt-1">
                        {scan.responseTime}ms
                      </span>
                    )}
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