'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  role: string;
  name: string;
}

interface PassHistory {
  id: string;
  status: 'active' | 'expired' | 'cancelled';
  vehicleDetails: {
    type: string;
    plateNumber: string;
    brand: string;
    model: string;
  };
  issueDate: string;
  expiryDate: string;
  purpose: string;
  duration: 'permanent' | 'temporary';
}

export default function History() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<PassHistory[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }

    const user = JSON.parse(userData);
    setUser(user);

    // Mock data - replace with actual API call
    setHistory([
      {
        id: 'VP-2024-001',
        status: 'active',
        vehicleDetails: {
          type: 'Car',
          plateNumber: 'ABC-123',
          brand: 'Toyota',
          model: 'Vios'
        },
        issueDate: '2024-01-01',
        expiryDate: '2024-12-31',
        purpose: 'Regular campus access',
        duration: 'permanent'
      },
      {
        id: 'VP-2023-002',
        status: 'expired',
        vehicleDetails: {
          type: 'Motorcycle',
          plateNumber: 'XYZ-789',
          brand: 'Honda',
          model: 'Click'
        },
        issueDate: '2023-01-01',
        expiryDate: '2023-12-31',
        purpose: 'Student transportation',
        duration: 'permanent'
      },
      {
        id: 'VP-2023-003',
        status: 'cancelled',
        vehicleDetails: {
          type: 'Car',
          plateNumber: 'DEF-456',
          brand: 'Mitsubishi',
          model: 'Mirage'
        },
        issueDate: '2023-06-01',
        expiryDate: '2023-08-31',
        purpose: 'Summer internship',
        duration: 'temporary'
      }
    ]);
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pass History</h1>
          <p className="text-gray-600">View your vehicle pass history</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.vehicleDetails.type} - {item.vehicleDetails.plateNumber}
                    <br />
                    <span className="text-xs text-gray-400">
                      {item.vehicleDetails.brand} {item.vehicleDetails.model}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.issueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.expiryDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.duration.charAt(0).toUpperCase() + item.duration.slice(1)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 