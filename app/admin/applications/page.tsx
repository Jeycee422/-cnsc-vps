'use client';

import { useState } from 'react';

export default function Applications() {
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with actual data from your backend
  const applications = [
    {
      id: 'APP-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      vehicleType: 'Car',
      plateNumber: 'ABC-123',
      status: 'pending',
      submittedDate: '2024-03-15',
      lastUpdated: '2024-03-15 14:30'
    },
    {
      id: 'APP-002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      vehicleType: 'Motorcycle',
      plateNumber: 'XYZ-789',
      status: 'approved',
      submittedDate: '2024-03-14',
      lastUpdated: '2024-03-15 10:15'
    },
    {
      id: 'APP-003',
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      vehicleType: 'Car',
      plateNumber: 'DEF-456',
      status: 'rejected',
      submittedDate: '2024-03-13',
      lastUpdated: '2024-03-14 16:45'
    },
    // Add more mock data as needed
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = statusFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-2 border-gray-300 py-2 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="bg-[#7E0303] text-white px-4 py-2 rounded-md hover:bg-[#5E0202] transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {application.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{application.name}</div>
                    <div className="text-sm text-gray-500">{application.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{application.vehicleType}</div>
                    <div className="text-sm text-gray-500">{application.plateNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.submittedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-[#7E0303] hover:text-[#5E0202] mr-3">
                      View
                    </button>
                    {application.status === 'pending' && (
                      <>
                        <button className="text-green-600 hover:text-green-900 mr-3">
                          Approve
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 