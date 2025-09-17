'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Applications() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [rfidValue, setRfidValue] = useState<string>('');
  const [isAssigningRfid, setIsAssigningRfid] = useState<boolean>(false);

  const token = useMemo(() => (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', []);

  const fetchApplications = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const statusParam = userRole === 'super_admin' ? 'approved' : undefined;
      const url = new URL(`${API_BASE}/api/admin/applications`);
      if (statusParam) url.searchParams.set('status', statusParam);
      const res = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load applications');
      }
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setErrorMessage('Not authenticated');
      return;
    }
    fetchApplications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userRole]);

  // Fetch user role
  useEffect(() => {
    if (!token) return;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        // Handle the response structure: { user: { id, firstName, lastName, email, role, ... } }
        const userData = data.user || data;
        setUserRole(userData.role || userData.userType || '');
      } catch {}
    })();
    return () => ac.abort();
  }, [API_BASE, token]);

  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(API_BASE, { auth: { token: `Bearer ${token}` } });
    socket.on('connect_error', (err: Error) => {
      // ignore socket errors for UI
      console.warn('Socket error:', err.message);
    });
    socket.on('vehiclePass:new', ({ application }: { application: any }) => {
      setApplications(prev => [application, ...prev]);
    });
    socket.on('vehiclePass:updated', ({ application }: { application: any }) => {
      setApplications(prev => prev.map(a => (a._id === application._id ? application : a)));
    });
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'registered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openViewModal = (application: any) => {
    setSelectedApplication(application);
    setRfidValue(application.rfidTag || '');
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedApplication(null);
    setRfidValue('');
  };

  const maskApplicationId = (id: string) => {
    if (!id || id.length < 8) return id;
    const start = id.substring(0, 4);
    const end = id.substring(id.length - 4);
    const middle = '*'.repeat(Math.max(4, id.length - 8));
    return `${start}${middle}${end}`;
  };

  const assignRfid = async () => {
    if (!selectedApplication || !rfidValue.trim()) return;
    
    setIsAssigningRfid(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/applications/${selectedApplication._id}/assign-rfid`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rfidTag: rfidValue.trim() })
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to assign RFID');
      }
      
      const data = await res.json();
      setApplications(prev => prev.map(a => 
        a._id === selectedApplication._id 
          ? { ...a, rfidTag: rfidValue.trim(), status: 'registered' }
          : a
      ));
      closeViewModal();
    } catch (err) {
      console.error('Error assigning RFID:', err);
      alert('Failed to assign RFID. Please try again.');
    } finally {
      setIsAssigningRfid(false);
    }
  };

  const filteredApplications = (statusFilter === 'all' ? applications : applications.filter(app => app.status === statusFilter))
    .filter(app => (userRole === 'super_admin' ? app.status === 'approved' : true));

  const approveApplication = async (applicationId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/applications/${applicationId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to approve application');
      }
      const data = await res.json();
      setApplications(prev => prev.map(a => (a._id === data.application.id ? { ...a, status: 'approved' } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const rejectApplication = async (applicationId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/applications/${applicationId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Not specified' })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to reject application');
      }
      const data = await res.json();
      setApplications(prev => prev.map(a => (a._id === data.application.id ? { ...a, status: 'rejected' } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="space-y-6"><h1 className="text-2xl font-semibold text-gray-900">{userRole === 'super_admin' ? 'Approved Applications' : 'Applications'}</h1><div>Loading...</div></div>;
  if (errorMessage) return <div className="space-y-6"><h1 className="text-2xl font-semibold text-gray-900">{userRole === 'super_admin' ? 'Approved Applications' : 'Applications'}</h1><div className="text-red-600">{errorMessage}</div></div>;
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{userRole === 'super_admin' ? 'Approved Applications' : 'Applications'}</h1>
        {userRole !== 'super_admin' && (
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
        )}
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
                  RFID Tag
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
                <tr key={application._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="font-mono">{maskApplicationId(application._id)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{application.applicant?.givenName} {application.applicant?.familyName}</div>
                    <div className="text-sm text-gray-500">{application.linkedUser?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{application.vehicleInfo?.type}</div>
                    <div className="text-sm text-gray-500">{application.vehicleInfo?.plateNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.rfidTag ? (
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                        {application.rfidTag}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => openViewModal(application)}
                      className="text-[#7E0303] hover:text-[#5E0202] mr-3"
                    >
                      View
                    </button>
                    {userRole !== 'super_admin' && application.status === 'pending' && (
                      <>
                        <button onClick={() => approveApplication(application._id)} className="text-green-600 hover:text-green-900 mr-3">
                          Approve
                        </button>
                        <button onClick={() => rejectApplication(application._id)} className="text-red-600 hover:text-red-900">
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

      {/* Application View Modal */}
      {showViewModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-gray-900">Application Details</h3>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Applicant Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Applicant Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedApplication.applicant?.givenName} {selectedApplication.applicant?.middleName} {selectedApplication.applicant?.familyName}</p>
                    <p><span className="font-medium">Email:</span> {selectedApplication.linkedUser?.email}</p>
                    <p><span className="font-medium">Contact:</span> {selectedApplication.applicant?.contactNumber}</p>
                    <p><span className="font-medium">ID Number:</span> {selectedApplication.applicant?.idNumber}</p>
                    <p><span className="font-medium">Affiliation:</span> {selectedApplication.applicant?.schoolAffiliation}</p>
                    {selectedApplication.applicant?.homeAddress && (
                      <p><span className="font-medium">Address:</span> {selectedApplication.applicant.homeAddress}</p>
                    )}
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Vehicle Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Type:</span> {selectedApplication.vehicleInfo?.type}</p>
                    <p><span className="font-medium">Plate Number:</span> {selectedApplication.vehicleInfo?.plateNumber}</p>
                    <p><span className="font-medium">OR Number:</span> {selectedApplication.vehicleInfo?.orNumber}</p>
                    <p><span className="font-medium">CR Number:</span> {selectedApplication.vehicleInfo?.crNumber}</p>
                    <p><span className="font-medium">Driver:</span> {selectedApplication.vehicleInfo?.driverName}</p>
                    <p><span className="font-medium">Driver License:</span> {selectedApplication.vehicleInfo?.driverLicense}</p>
                  </div>
                </div>
              </div>

              {/* Application Status */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Application Status</h4>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedApplication.status)}`}>
                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-600">
                    Submitted: {new Date(selectedApplication.createdAt).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600">
                    Updated: {new Date(selectedApplication.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* RFID Assignment Section (for super_admin on approved applications) */}
              {userRole === 'super_admin' && selectedApplication.status === 'approved' && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">RFID Assignment</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="rfidValue" className="block text-sm font-medium text-gray-700 mb-2">
                        RFID Tag Value
                      </label>
                      <input
                        type="text"
                        id="rfidValue"
                        value={rfidValue}
                        onChange={(e) => setRfidValue(e.target.value)}
                        placeholder="Enter RFID tag value"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7E0303] focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={assignRfid}
                        disabled={!rfidValue.trim() || isAssigningRfid}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#7E0303] rounded-md hover:bg-[#5E0202] focus:outline-none focus:ring-2 focus:ring-[#7E0303] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAssigningRfid ? 'Assigning...' : 'Assign RFID & Register'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Attached Documents (for online applications) */}
              {selectedApplication.attachedDocuments && selectedApplication.attachedDocuments.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Attached Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApplication.attachedDocuments.map((doc: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {doc.type === 'orCrCopy' ? 'OR/CR Copy' : 
                             doc.type === 'driversLicenseCopy' ? 'Driver\'s License Copy' : 
                             doc.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                          </span>
                        </div>
                        {doc.url && (
                          <div className="space-y-2">
                            <img
                              src={doc.url}
                              alt={`${doc.type} document`}
                              className="w-full h-32 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden text-center text-sm text-gray-500 py-8 border border-gray-200 rounded">
                              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Document preview not available
                            </div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-[#7E0303] hover:text-[#5E0202]"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              View Full Size
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current RFID Status */}
              {selectedApplication.rfidTag && (
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">RFID Tag Assigned</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">RFID Value:</span> 
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs ml-2">
                      {selectedApplication.rfidTag}
                    </span>
                  </p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 