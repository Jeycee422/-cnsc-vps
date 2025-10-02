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
  const [isReassignMode, setIsReassignMode] = useState<boolean>(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmApplicationId, setConfirmApplicationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [assignAlert, setAssignAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const token = useMemo(() => (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', []);

  const fetchApplications = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const url = new URL(`${API_BASE}/api/admin/applications`);
      
      // Only apply status filter for non-super_admin users
      if (userRole !== 'super_admin' && statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter);
      }
      
      const res = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load applications');
      }
      const data = await res.json();
      
      // For super_admin, only show approved and completed applications
      let filteredApplications = data.applications || [];
      if (userRole === 'super_admin') {
        filteredApplications = filteredApplications.filter((app: any) => 
          app.status === 'approved' || app.status === 'completed'
        );
      }
      
      setApplications(filteredApplications);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && (err as any).name === 'AbortError') {
        return;
      }
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
    const ac = new AbortController();
    fetchApplications(ac.signal);
    return () => ac.abort();
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

  // Auto-scroll to show actions column when applications are loaded
  useEffect(() => {
    if (applications.length > 0 && !isLoading) {
      const timer = setTimeout(() => {
        const tableContainer = document.querySelector('.overflow-x-auto');
        if (tableContainer) {
          // Scroll to show the actions column (scroll to the right)
          tableContainer.scrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [applications, isLoading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'registered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isImageAttachment = (doc: any): boolean => {
    if (!doc) return false;
    const mimeType = (doc.mimeType || doc.contentType || '').toString();
    if (mimeType.startsWith('image/')) return true;
    const url: string = (doc.url || '').toString();
    if (!url) return false;
    const path = url.split('?')[0];
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(path);
  };

  const getDocumentUrl = (doc: any, appId?: string, tokenParam?: string): string => {
    // Prefer proxy that attaches Authorization server-side
    if (appId && doc?.fileType) {
      const url = `/api/proxy/file?applicationId=${encodeURIComponent(appId)}&fileType=${encodeURIComponent(doc.fileType)}${tokenParam ? `&token=${encodeURIComponent(tokenParam)}` : ''}`;
      return url;
    }
    // Fallback to raw URL normalization if present
    const raw = (doc?.url || '').toString();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const needsSlash = !(API_BASE.endsWith('/') || raw.startsWith('/'));
    return `${API_BASE}${needsSlash ? '/' : ''}${raw}`;
  };

  const openViewModal = (application: any) => {
    setSelectedApplication(application);
    setRfidValue(application.rfidInfo?.tagId || '');
    setIsReassignMode(false);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedApplication(null);
    setRfidValue('');
    setIsReassignMode(false);
    setAssignAlert(null);
  };

  const openConfirmModal = (action: 'approve' | 'reject', applicationId: string) => {
    setConfirmAction(action);
    setConfirmApplicationId(applicationId);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmApplicationId(null);
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
      // Debug: log request payload
      try { console.log('[RFID] Assign request', { applicationId: selectedApplication._id, tagId: rfidValue.trim() }); } catch {}
      const res = await fetch(`${API_BASE}/api/rfid/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          applicationId: selectedApplication._id,
          tagId: rfidValue.trim(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        })
      });
      
      if (!res.ok) {
        // Build a friendly message from API response and status
        let friendly = '';
        try {
          const errorData = await res.json();
          const apiMessage = (errorData && (errorData.error || errorData.message)) ? String(errorData.error || errorData.message) : '';
          if (res.status === 400) friendly = apiMessage || 'Invalid RFID details. Please check and try again.';
          else if (res.status === 401 || res.status === 403) friendly = 'You are not authorized to assign RFID.';
          else if (res.status === 404) friendly = 'Application not found or no longer available.';
          else if (res.status === 409) friendly = apiMessage || 'This RFID tag is already assigned to another application.';
          else if (res.status === 429) friendly = 'Too many attempts. Please wait a moment and try again.';
          else if (res.status >= 500) friendly = 'Server error while assigning RFID. Please try again later.';
          else friendly = apiMessage || 'Failed to assign RFID. Please try again.';
        } catch {
          const text = await res.text().catch(() => '');
          if (res.status === 400) friendly = 'Invalid RFID details. Please check and try again.';
          else if (res.status === 401 || res.status === 403) friendly = 'You are not authorized to assign RFID.';
          else if (res.status === 404) friendly = 'Application not found or no longer available.';
          else if (res.status === 409) friendly = 'This RFID tag is already assigned to another application.';
          else if (res.status === 429) friendly = 'Too many attempts. Please wait a moment and try again.';
          else if (res.status >= 500) friendly = 'Server error while assigning RFID. Please try again later.';
          else friendly = text || 'Failed to assign RFID. Please try again.';
        }
        setAssignAlert({ type: 'error', text: friendly });
        return;
      }
      
      const data = await res.json();
      // Debug: log success response
      try { console.log('[RFID] Assign response', data); } catch {}
      
      // Calculate expiry date (1 year from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      // Update the application with the new RFID info and expiry date (mirror server status)
      setApplications(prev => prev.map(a => 
        a._id === selectedApplication._id 
          ? { 
              ...a, 
              rfidInfo: {
                ...data.application.rfidInfo,
                validUntil: expiryDate.toISOString()
              },
              expiryDate: expiryDate.toISOString(),
              status: data?.application?.status || a.status
            }
          : a
      ));
      
      // Update the selected application for the modal (mirror server status)
      setSelectedApplication((current: any) => current ? {
        ...current,
        rfidInfo: {
          ...data.application.rfidInfo,
          validUntil: expiryDate.toISOString()
        },
        expiryDate: expiryDate.toISOString(),
        status: data?.application?.status || current.status
      } : null);
      
      setAssignAlert({ type: 'success', text: isReassignMode ? 'RFID reassigned successfully.' : 'RFID assigned successfully.' });
      // Sync list with backend state in case sockets are missed or server keeps a different status label
      try {
        const ac = new AbortController();
        fetchApplications(ac.signal);
        setTimeout(() => ac.abort(), 15000);
      } catch {}
      closeViewModal();
    } catch (err) {
      console.error('Error assigning RFID:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign RFID. Please try again.';
      setAssignAlert({ type: 'error', text: errorMessage });
    } finally {
      setIsAssigningRfid(false);
    }
  };

  const filteredApplications = useMemo(() => {
    let filtered = applications;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        const applicantName = `${app.applicant?.givenName || ''} ${app.applicant?.middleName || ''} ${app.applicant?.familyName || ''}`.toLowerCase();
        const email = app.linkedUser?.email?.toLowerCase() || '';
        const plateNumber = app.vehicleInfo?.plateNumber?.toLowerCase() || '';
        const vehicleType = app.vehicleInfo?.type?.toLowerCase() || '';
        const idNumber = app.idNumber?.toLowerCase() || '';
        const contactNumber = app.contactNumber?.toLowerCase() || '';
        const affiliation = app.schoolAffiliation?.toLowerCase() || '';
        const applicationId = app._id?.toLowerCase() || '';
        
        return applicantName.includes(searchLower) ||
               email.includes(searchLower) ||
               plateNumber.includes(searchLower) ||
               vehicleType.includes(searchLower) ||
               idNumber.includes(searchLower) ||
               contactNumber.includes(searchLower) ||
               affiliation.includes(searchLower) ||
               applicationId.includes(searchLower);
      });
    }
    
    return filtered;
  }, [applications, statusFilter, searchTerm]);

  const derivedAttachedDocs = useMemo(() => {
    if (!selectedApplication) return [] as any[];
    // New backend shape: attachments is an object keyed by fileType
    if (selectedApplication.attachments && typeof selectedApplication.attachments === 'object') {
      const entries = Object.entries(selectedApplication.attachments as Record<string, any>)
        .filter(([, info]) => info && (info.fileId || info.fileName));
      return entries.map(([fileType, info]) => ({
        fileType,
        type: fileType,
        mimeType: info.mimeType,
        size: info.fileSize,
        url: '',
      }));
    }
    // Legacy shape: attachedDocuments is an array with type/url
    if (Array.isArray(selectedApplication.attachedDocuments)) {
      return (selectedApplication.attachedDocuments as any[]).map((doc) => ({
        ...doc,
        fileType: doc.type || doc.fileType,
      }));
    }
    return [] as any[];
  }, [selectedApplication]);

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
      closeConfirmModal();
    } catch (err) {
      console.error(err);
      alert('Failed to approve application. Please try again.');
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
      closeConfirmModal();
    } catch (err) {
      console.error(err);
      alert('Failed to reject application. Please try again.');
    }
  };

  if (isLoading) return <div className="space-y-6"><h1 className="text-2xl font-semibold text-gray-900">{userRole === 'super_admin' ? 'Approved & Completed Applications' : 'Applications'}</h1><div>Loading...</div></div>;
  if (errorMessage) return <div className="space-y-6"><h1 className="text-2xl font-semibold text-gray-900">{userRole === 'super_admin' ? 'Approved & Completed Applications' : 'Applications'}</h1><div className="text-red-600">{errorMessage}</div></div>;
  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{userRole === 'super_admin' ? 'Approved & Completed Applications' : 'Applications'}</h1>
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
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="bg-[#7E0303] text-white px-4 py-2 rounded-md hover:bg-[#5E0202] transition-colors">
            Export
          </button>
        </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search applications by name, email, plate number, ID, contact, affiliation, or application ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#7E0303] focus:border-[#7E0303]"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Found {filteredApplications.length} application(s) matching "{searchTerm}"
          </p>
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
                    {application.rfidInfo?.tagId ? (
                      <div className="space-y-1">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          {application.rfidInfo.tagId}
                        </span>
                        <div className="text-xs text-gray-500">
                          {application.rfidInfo.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
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
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openViewModal(application)}
                        className="px-3 py-1 text-sm font-medium text-white bg-[#7E0303] rounded-md hover:bg-[#5E0202] transition-colors cursor-pointer"
                      >
                        View
                      </button>
                      {userRole !== 'super_admin' && application.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => openConfirmModal('approve', application._id)} 
                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => openConfirmModal('reject', application._id)} 
                            className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
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

              {assignAlert && (
                <div className={`mb-4 p-4 rounded-md border ${assignAlert.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <svg className={`w-5 h-5 mt-0.5 ${assignAlert.type === 'success' ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        {assignAlert.type === 'success' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L9 13.414l4.707-4.707z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        )}
                      </svg>
                      <p className="text-sm">{assignAlert.text}</p>
                    </div>
                    <button onClick={() => setAssignAlert(null)} className="text-gray-500 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Applicant Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Applicant Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedApplication.applicant?.givenName} {selectedApplication.applicant?.middleName} {selectedApplication.applicant?.familyName}</p>
                    <p><span className="font-medium">Email:</span> {selectedApplication.linkedUser?.email}</p>
                    <p><span className="font-medium">Contact:</span> {selectedApplication.contactNumber || 'Not provided'}</p>
                    <p><span className="font-medium">ID Number:</span> {selectedApplication.idNumber || 'Not provided'}</p>
                    <p><span className="font-medium">Affiliation:</span> {selectedApplication.schoolAffiliation || 'Not provided'}</p>
                    
                    {/* Show employment status only for personnel */}
                    {selectedApplication.schoolAffiliation?.toLowerCase() === 'personnel' && (
                      <p><span className="font-medium">Employment Status:</span> {selectedApplication.employmentStatus || 'Not provided'}</p>
                    )}
                    
                    <p><span className="font-medium">Vehicle User Type:</span> {selectedApplication.vehicleUserType || 'Not provided'}</p>
                    
                    {selectedApplication.homeAddress && (
                      <p><span className="font-medium">Address:</span> {selectedApplication.homeAddress}</p>
                    )}
                    
                    {/* Show guardian details only for students */}
                    {selectedApplication.schoolAffiliation?.toLowerCase() === 'student' && (
                      <>
                        {selectedApplication.guardianName && (
                          <p><span className="font-medium">Guardian Name:</span> {selectedApplication.guardianName}</p>
                        )}
                        {selectedApplication.guardianAddress && (
                          <p><span className="font-medium">Guardian Address:</span> {selectedApplication.guardianAddress}</p>
                        )}
                      </>
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

              {/* RFID Assignment / Reassignment Section */}
              {userRole === 'super_admin' && (selectedApplication.status === 'approved' || isReassignMode) && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">{isReassignMode ? 'Reassign RFID' : 'RFID Assignment'}</h4>
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
                        {isAssigningRfid ? (isReassignMode ? 'Reassigning...' : 'Assigning...') : (isReassignMode ? 'Reassign RFID' : 'Assign RFID & Register')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Attached Documents (for online applications) - visible to admin and super_admin */}
              {derivedAttachedDocs && derivedAttachedDocs.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Attached Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {derivedAttachedDocs.map((doc: any, index: number) => {
                      const docUrl = getDocumentUrl({ ...doc, url: doc.url }, selectedApplication._id, token);
                      const looksLikeImage = isImageAttachment({ ...doc, url: docUrl }) || !!docUrl; // try image if URL exists
                      return (
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
                        {docUrl && looksLikeImage ? (
                          <div className="space-y-2">
                            <img
                              src={docUrl}
                              alt={`${doc.type || 'Attachment'} preview`}
                              className="w-full h-40 object-cover rounded border cursor-zoom-in"
                              onClick={() => setImagePreviewUrl(docUrl)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                                // Helpful for debugging if images are protected or invalid
                                try { console.warn('Failed to load image attachment:', doc); } catch {}
                              }}
                            />
                            <div className="hidden text-center text-sm text-gray-500 py-8 border border-gray-200 rounded">
                              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Image preview not available
                            </div>
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                className="text-sm text-gray-600 hover:text-gray-800 underline"
                                onClick={() => setImagePreviewUrl(docUrl)}
                              >
                                Open Preview
                              </button>
                              <a
                                href={docUrl}
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
                          </div>
                        ) : (
                          docUrl && (
                            <div className="space-y-2">
                              <div className="text-center text-sm text-gray-500 py-8 border border-gray-200 rounded">
                                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Document preview not available
                              </div>
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-[#7E0303] hover:text-[#5E0202]"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Open Document
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    );})}
                  </div>
                </div>
              )}

              {/* Current RFID Status */}
              {selectedApplication.rfidInfo?.tagId && (
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">RFID Tag Assigned</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">RFID Value:</span> 
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs ml-2">
                        {selectedApplication.rfidInfo.tagId}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${selectedApplication.rfidInfo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedApplication.rfidInfo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Assigned:</span> {new Date(selectedApplication.rfidInfo.assignedAt).toLocaleString()}
                    </p>
                    {selectedApplication.rfidInfo.validUntil && (
                      <p>
                        <span className="font-medium">Valid Until:</span> {new Date(selectedApplication.rfidInfo.validUntil).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {userRole === 'super_admin' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setIsReassignMode(true);
                          setRfidValue(selectedApplication.rfidInfo?.tagId || '');
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        Reassign RFID
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#7E0303] rounded-md hover:bg-[#5E0202] focus:outline-none focus:ring-2 focus:ring-[#7E0303]"
                >
                  Print Application
                </button>
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

      {/* Image Lightbox Preview */}
      {imagePreviewUrl && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-75 flex items-center justify-center">
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-200"
            onClick={() => setImagePreviewUrl(null)}
            aria-label="Close image preview"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={imagePreviewUrl}
            alt="Attachment preview"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded shadow-2xl"
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && confirmApplicationId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to {confirmAction} this vehicle pass application? This action cannot be undone.
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={closeConfirmModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (confirmAction === 'approve') {
                        approveApplication(confirmApplicationId);
                      } else {
                        rejectApplication(confirmApplicationId);
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors cursor-pointer ${
                      confirmAction === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {confirmAction === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
} 