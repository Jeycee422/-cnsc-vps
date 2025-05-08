'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  role: string;
  name: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }

    const user = JSON.parse(userData);
    setUser(user);
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('user');
            router.push('/signin');
          }}
          className="px-4 py-2 text-[#7E0303] border-2 border-[#7E0303] rounded-md hover:bg-[#7E0303] hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Vehicle Pass Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">My Vehicle Pass</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border-2 border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Status</h3>
            <p className="text-[#7E0303] font-semibold">Active</p>
          </div>
          <div className="p-4 border-2 border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Expiry Date</h3>
            <p className="text-gray-600">December 31, 2024</p>
          </div>
          <div className="p-4 border-2 border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Vehicle Details</h3>
            <p className="text-gray-600">Toyota Vios - ABC-123</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 border-2 border-gray-200 rounded-lg text-left hover:border-[#7E0303] transition-colors">
            <h3 className="font-medium text-gray-900">Renew Vehicle Pass</h3>
            <p className="text-gray-600">Extend your vehicle pass validity</p>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg text-left hover:border-[#7E0303] transition-colors">
            <h3 className="font-medium text-gray-900">Update Vehicle Details</h3>
            <p className="text-gray-600">Modify your vehicle information</p>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg text-left hover:border-[#7E0303] transition-colors">
            <h3 className="font-medium text-gray-900">View Pass History</h3>
            <p className="text-gray-600">Check your pass usage history</p>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg text-left hover:border-[#7E0303] transition-colors">
            <h3 className="font-medium text-gray-900">Report an Issue</h3>
            <p className="text-gray-600">Report problems with your pass</p>
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