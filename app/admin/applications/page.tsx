'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// FIXED: Proper API_BASE declaration with fallback
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// FIXED: Add TypeScript interfaces for better type safety
interface Applicant {
  givenName: string;
  middleName?: string;
  familyName: string;
}

interface VehicleInfo {
  type: string;
  plateNumber: string;
  orNumber?: string;
  crNumber?: string;
  driverName?: string;
  driverLicense?: string;
}

interface RfidInfo {
  tagId: string;
  isActive: boolean;
  assignedAt: string;
  validUntil?: string;
}

interface Document {
  fileType: string;
  type: string;
  mimeType?: string;
  size?: number;
  url?: string;
  fileName?: string;
  fileId?: string;
  index?: number;
  displayName?: string;
}

interface Application {
  _id: string;
  applicant: Applicant;
  linkedUser?: {
    email: string;
  };
  vehicleInfo: VehicleInfo;
  status: 'pending' | 'approved' | 'registered' | 'completed' | 'rejected';
  rfidInfo?: RfidInfo;
  createdAt: string;
  updatedAt: string;
  contactNumber?: string;
  idNumber?: string;
  schoolAffiliation?: string;
  employmentStatus?: string;
  vehicleUserType?: string;
  homeAddress?: string;
  guardianName?: string;
  guardianAddress?: string;
  attachments?: Record<string, any>;
  attachedDocuments?: Document[];
}

export default function Applications() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [rfidValue, setRfidValue] = useState<string>('');
  const [isAssigningRfid, setIsAssigningRfid] = useState<boolean>(false);
  const [isReassignMode, setIsReassignMode] = useState<boolean>(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmApplicationId, setConfirmApplicationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [assignAlert, setAssignAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Scanner states
  const [isScannerConnected, setIsScannerConnected] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerStatus, setScannerStatus] = useState<string>('Disconnected');

  const token = useMemo(() => (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', []);

  // FIXED: Enhanced Web Serial API Scanner Integration with better error handling
  const connectSerialScanner = async () => {
    if (!('serial' in navigator)) {
      setScannerStatus('Web Serial API not supported in this browser');
      alert('Web Serial API is not supported in your browser. Please use Chrome, Edge, or Opera.');
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      setIsScannerConnected(true);
      setScannerStatus('Connected - Ready to scan');
      
      const reader = port.readable.getReader();
      
      const readScannerData = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              reader.releaseLock();
              break;
            }
            
            const scannedData = new TextDecoder().decode(value).trim();
            if (scannedData && scannedData.length > 5) {
              const cleanRfid = scannedData.replace(/[^a-zA-Z0-9]/g, '');
              if (cleanRfid) {
                setRfidValue(cleanRfid);
                setIsScanning(false);
                setScannerStatus(`Scanned: ${cleanRfid}`);
              }
            }
          }
        } catch (error) {
          console.error('Scanner read error:', error);
          setScannerStatus('Scanner read error');
          setIsScannerConnected(false);
        }
      };
      
      readScannerData();
      
    } catch (error) {
      console.error('Scanner connection error:', error);
      setScannerStatus('Failed to connect scanner');
      setIsScannerConnected(false);
    }
  };

  const disconnectScanner = () => {
    setIsScannerConnected(false);
    setScannerStatus('Disconnected');
    setIsScanning(false);
  };

  const startScanning = () => {
    if (isScannerConnected) {
      setIsScanning(true);
      setScannerStatus('Scanning... Wave tag near scanner');
    }
  };

  const clearRfidValue = () => {
    setRfidValue('');
    setIsScanning(false);
    if (isScannerConnected) {
      setScannerStatus('Connected - Ready to scan');
    }
  };

  // FIXED: Enhanced fetchApplications with better error handling
  const fetchApplications = async (signal?: AbortSignal) => {
    if (!token) {
      setIsLoading(false);
      setErrorMessage('Not authenticated');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const url = new URL(`${API_BASE}/api/admin/applications`);
      
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
        const errorText = await res.text();
        throw new Error(errorText || `Failed to load applications: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      let filteredApplications = data.applications || [];
      if (userRole === 'super_admin') {
        filteredApplications = filteredApplications.filter((app: Application) => 
          app.status === 'approved' || app.status === 'completed'
        );
      }
      
      setApplications(filteredApplications);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && (err as any).name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setErrorMessage(message);
      console.error('Error fetching applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchApplications(ac.signal).catch(() => {});
    return () => {
      try { ac.abort(); } catch {}
    };
  }, [token, userRole, statusFilter]);

  // Fetch user role
  useEffect(() => {
    if (!token) return;
    
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          signal: ac.signal,
        });
        
        if (!res.ok) {
          console.warn('Failed to fetch user role');
          return;
        }
        
        const data = await res.json();
        const userData = data.user || data;
        setUserRole(userData.role || userData.userType || '');
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        console.error('Error fetching user role:', error);
      }
    })();
    
    return () => { try { ac.abort(); } catch {} };
  }, [token]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!token) return;
    
    const socket: Socket = io(API_BASE, { 
      auth: { token: `Bearer ${token}` } 
    });
    
    socket.on('connect_error', (err: Error) => {
      console.warn('Socket connection error:', err.message);
    });
    
    socket.on('vehiclePass:new', ({ application }: { application: Application }) => {
      setApplications(prev => [application, ...prev]);
    });
    
    socket.on('vehiclePass:updated', ({ application }: { application: Application }) => {
      setApplications(prev => prev.map(a => (a._id === application._id ? application : a)));
    });
    
    return () => {
      try { socket.disconnect(); } catch {}
    };
  }, [token]);

  // Auto-scroll to show actions column when applications are loaded
  useEffect(() => {
    if (applications.length > 0 && !isLoading) {
      const timer = setTimeout(() => {
        const tableContainer = document.querySelector('.overflow-x-auto');
        if (tableContainer) {
          tableContainer.scrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [applications, isLoading]);

  // FIXED: Enhanced status color function
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'registered':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // FIXED: Enhanced file type detection
  const isImageAttachment = (doc: Document): boolean => {
    if (!doc) return false;
    const mimeType = (doc.mimeType || '').toString().toLowerCase();
    if (mimeType.startsWith('image/')) return true;
    
    const fileName = (doc.fileName || '').toString().toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
  };

  const isPdfAttachment = (doc: Document): boolean => {
    if (!doc) return false;
    const mimeType = (doc.mimeType || '').toString().toLowerCase();
    if (mimeType === 'application/pdf') return true;
    
    const fileName = (doc.fileName || '').toString().toLowerCase();
    return /\.pdf$/i.test(fileName);
  };

  const isDocumentAttachment = (doc: Document): boolean => {
    if (!doc) return false;
    const mimeType = (doc.mimeType || '').toString().toLowerCase();
    if (mimeType.includes('word') || mimeType.includes('document')) return true;
    
    const fileName = (doc.fileName || '').toString().toLowerCase();
    return /\.(doc|docx)$/i.test(fileName);
  };

  // FIXED: Route document access through Next proxy to include auth for <img>/<embed>
  const getDocumentUrl = (doc: Document, applicationId?: string): string => {
    console.log('Generating URL for document:', doc);
    
    if (!applicationId) {
      console.error('No application ID provided');
      return '';
    }

    // If document has a direct absolute URL, use it as-is
    if (doc.url && typeof doc.url === 'string' && doc.url.trim() !== '') {
      const url = doc.url.trim();
      if (/^https?:\/\//i.test(url)) {
        return url;
      }
      // Fall through to proxy below for relative URLs so we can attach auth
    }

    // Build proxy URL so images/PDFs load with credentials via token query
    const params = new URLSearchParams();
    params.set('applicationId', applicationId);
    params.set('fileType', doc.type);
    if (doc.type === 'orCrCopy' && doc.index) {
      params.set('index', String(doc.index));
    }
    if (token) {
      params.set('token', token);
    }
    const proxyUrl = `/api/proxy/file?${params.toString()}`;
    console.log('Generated document proxy URL:', proxyUrl);
    return proxyUrl;
  };

  // FIXED: Enhanced document preview with proper error handling
  const handleDocumentPreview = async (doc: Document) => {
    console.log('Attempting to preview document:', doc);
    
    if (!selectedApplication?._id) {
      console.error('No application ID found for document');
      alert('Application ID not available');
      return;
    }

    try {
      const docUrl = getDocumentUrl(doc, selectedApplication._id);
      console.log('Preview URL:', docUrl);
      
      if (!docUrl) {
        throw new Error('Could not generate document URL');
      }

      // Add authorization header for the request
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };

      // Test if the URL is accessible
      const testResponse = await fetch(docUrl, { 
        method: 'HEAD',
        headers 
      });
      
      if (!testResponse.ok) {
        throw new Error(`Document not accessible: ${testResponse.status} ${testResponse.statusText}`);
      }

      if (isImageAttachment(doc)) {
        // For images, use the lightbox
        setImagePreviewUrl(docUrl);
      } else {
        // For other files, open in new tab with authorization
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.location.href = docUrl;
        } else {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }
      }
    } catch (error) {
      console.error('Error previewing document:', error);
      alert(`Unable to preview document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // FIXED: Enhanced document download with proper error handling
  const handleDocumentDownload = async (doc: Document) => {
    console.log('Attempting to download document:', doc);
    
    if (!selectedApplication?._id) {
      console.error('No application ID found for document');
      alert('Application ID not available');
      return;
    }

    try {
      const docUrl = getDocumentUrl(doc, selectedApplication._id);
      console.log('Download URL:', docUrl);
      
      if (!docUrl) {
        throw new Error('Could not generate document URL');
      }

      const response = await fetch(docUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const fileExtension = getFileExtension(doc.mimeType);
      const fileName = doc.fileName || `${doc.displayName || doc.type}${fileExtension}`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      alert(`Unable to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to get file extension from MIME type
  const getFileExtension = (mimeType?: string): string => {
    if (!mimeType) return '';
    
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    };
    
    return extensions[mimeType] || '';
  };

  const openViewModal = (application: Application) => {
    setSelectedApplication(application);
    setRfidValue(application.rfidInfo?.tagId || '');
    setIsReassignMode(false);
    setShowViewModal(true);
    setAssignAlert(null);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedApplication(null);
    setRfidValue('');
    setIsReassignMode(false);
    setAssignAlert(null);
    setIsScanning(false);
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

  // FIXED: Enhanced RFID assignment with better error handling
  const assignRfid = async () => {
    if (!selectedApplication || !rfidValue.trim()) {
      setAssignAlert({ type: 'error', text: 'RFID value is required' });
      return;
    }
    
    setIsAssigningRfid(true);
    try {
      const res = await fetch(`${API_BASE}/api/rfid/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          applicationId: selectedApplication._id,
          tagId: rfidValue.trim(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
      
      if (!res.ok) {
        let friendlyMessage = 'Failed to assign RFID';
        try {
          const errorData = await res.json();
          const apiMessage = errorData?.error || errorData?.message;
          
          switch (res.status) {
            case 400:
              friendlyMessage = apiMessage || 'Invalid RFID details';
              break;
            case 401:
            case 403:
              friendlyMessage = 'You are not authorized to assign RFID';
              break;
            case 404:
              friendlyMessage = 'Application not found';
              break;
            case 409:
              friendlyMessage = apiMessage || 'RFID tag already assigned';
              break;
            case 429:
              friendlyMessage = 'Too many attempts, please wait';
              break;
            case 500:
              friendlyMessage = 'Server error, please try again later';
              break;
            default:
              friendlyMessage = apiMessage || 'Failed to assign RFID';
          }
        } catch {
          friendlyMessage = `Failed to assign RFID: ${res.status} ${res.statusText}`;
        }
        throw new Error(friendlyMessage);
      }
      
      const data = await res.json();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      // Update applications list
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
      
      // Update selected application in modal
      setSelectedApplication(current => current ? {
        ...current,
        rfidInfo: {
          ...data.application.rfidInfo,
          validUntil: expiryDate.toISOString()
        },
        expiryDate: expiryDate.toISOString(),
        status: data?.application?.status || current.status
      } : null);
      
      setAssignAlert({ 
        type: 'success', 
        text: isReassignMode ? 'RFID reassigned successfully' : 'RFID assigned successfully' 
      });
      
      // Refresh applications list
      setTimeout(() => {
        fetchApplications();
      }, 1000);
      
    } catch (err) {
      console.error('Error assigning RFID:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign RFID';
      setAssignAlert({ type: 'error', text: errorMessage });
    } finally {
      setIsAssigningRfid(false);
    }
  };

  // FIXED: Enhanced application filtering
  const filteredApplications = useMemo(() => {
    let filtered = applications;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
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

  // FIXED: Enhanced document derivation with better type checking
  const derivedAttachedDocs = useMemo(() => {
    if (!selectedApplication) return [] as Document[];
    
    const docs: Document[] = [];
    
    // Check for attachments object
    if (selectedApplication.attachments && typeof selectedApplication.attachments === 'object') {
      Object.entries(selectedApplication.attachments).forEach(([fileType, info]) => {
        if (info && typeof info === 'object') {
          const fileInfo = info as any;
          
          // Handle OR/CR copy which can be an array of files
          if (fileType === 'orCrCopy' && Array.isArray(fileInfo)) {
            fileInfo.forEach((item: any, index: number) => {
              if (item && (item.fileId || item.fileName || item.url)) {
                docs.push({
                  fileType: 'orCrCopy',
                  type: 'orCrCopy',
                  mimeType: item.mimeType,
                  size: item.fileSize,
                  url: item.url || '',
                  index: index + 1,
                  fileName: item.fileName || `OR/CR Copy ${index + 1}`,
                  fileId: item.fileId,
                  displayName: `OR/CR Copy ${index + 1}`
                });
              }
            });
          } 
          // Handle single file attachment
          else if (fileInfo.fileId || fileInfo.fileName || fileInfo.url) {
            docs.push({
              fileType,
              type: fileType,
              mimeType: fileInfo.mimeType,
              size: fileInfo.fileSize,
              url: fileInfo.url || '',
              fileName: fileInfo.fileName || fileType,
              fileId: fileInfo.fileId,
              displayName: fileType
            });
          }
        }
      });
    }
    
    // Check for attachedDocuments array
    if (Array.isArray(selectedApplication.attachedDocuments)) {
      selectedApplication.attachedDocuments.forEach((doc: any) => {
        if (doc) {
          docs.push({
            ...doc,
            fileType: doc.type || doc.fileType,
            fileName: doc.fileName || doc.name,
            url: doc.url || '',
            displayName: doc.displayName || doc.type || 'Document'
          });
        }
      });
    }
    
    return docs;
  }, [selectedApplication]);

  // FIXED: Enhanced application approval/rejection
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
        const errorText = await res.text();
        throw new Error(errorText || `Failed to approve application: ${res.status}`);
      }
      
      const data = await res.json();
      setApplications(prev => prev.map(a => 
        a._id === applicationId ? { ...a, status: 'approved' } : a
      ));
      closeConfirmModal();
      
      // Show success message
      setAssignAlert({ type: 'success', text: 'Application approved successfully' });
    } catch (err) {
      console.error('Error approving application:', err);
      alert(`Failed to approve application: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        const errorText = await res.text();
        throw new Error(errorText || `Failed to reject application: ${res.status}`);
      }
      
      const data = await res.json();
      setApplications(prev => prev.map(a => 
        a._id === applicationId ? { ...a, status: 'rejected' } : a
      ));
      closeConfirmModal();
      
      // Show success message
      setAssignAlert({ type: 'success', text: 'Application rejected successfully' });
    } catch (err) {
      console.error('Error rejecting application:', err);
      alert(`Failed to reject application: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {userRole === 'super_admin' ? 'Approved & Completed Applications' : 'Applications'}
        </h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7E0303]"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (errorMessage) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {userRole === 'super_admin' ? 'Approved & Completed Applications' : 'Applications'}
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchApplications()}
            className="mt-2 px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ... (rest of the JSX return statement remains the same as in your original code)
  // The JSX is quite long, so I've focused on fixing the TypeScript/JavaScript logic
  // The JSX structure from your original code should work with these fixes
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
                      
                      {selectedApplication.schoolAffiliation?.toLowerCase() === 'personnel' && (
                        <p><span className="font-medium">Employment Status:</span> {selectedApplication.employmentStatus || 'Not provided'}</p>
                      )}
                      
                      <p><span className="font-medium">Vehicle User Type:</span> {selectedApplication.vehicleUserType || 'Not provided'}</p>
                      
                      {selectedApplication.homeAddress && (
                        <p><span className="font-medium">Address:</span> {selectedApplication.homeAddress}</p>
                      )}
                      
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
                    
                    {/* Scanner Control Panel */}
                    <div className="mb-4 p-3 bg-white rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                            isScannerConnected ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          <span className="text-sm font-medium">
                            Scanner: {scannerStatus}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {!isScannerConnected ? (
                            <button
                              onClick={connectSerialScanner}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Connect Scanner
                            </button>
                          ) : (
                            <button
                              onClick={disconnectScanner}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Disconnect
                            </button>
                          )}
                          {isScannerConnected && (
                            <button
                              onClick={startScanning}
                              disabled={isScanning}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {isScanning ? 'Scanning...' : 'Start Scan'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {isScanning && (
                        <div className="mt-2 text-xs text-blue-600 animate-pulse">
                          🔍 Scanning... Wave RFID tag near scanner
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="rfidValue" className="block text-sm font-medium text-gray-700 mb-2">
                          RFID Tag Value
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            id="rfidValue"
                            value={rfidValue}
                            onChange={(e) => setRfidValue(e.target.value)}
                            placeholder="Enter RFID tag value manually or use scanner"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7E0303] focus:border-transparent"
                          />
                          <button
                            onClick={clearRfidValue}
                            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            title="Clear RFID value"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {rfidValue && (
                          <p className="text-xs text-green-600 mt-1">
                            ✅ RFID value captured: <span className="font-mono">{rfidValue}</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={assignRfid}
                          disabled={!rfidValue.trim() || isAssigningRfid}
                          className="px-4 py-2 text-sm font-medium text-white bg-[#7E0303] rounded-md hover:bg-[#5E0202] focus:outline-none focus:ring-2 focus:ring-[#7E0303] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAssigningRfid 
                            ? (isReassignMode ? 'Reassigning...' : 'Assigning...') 
                            : (isReassignMode ? 'Reassign RFID' : 'Assign RFID & Register')
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attached Documents */}
                {derivedAttachedDocs && derivedAttachedDocs.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Attached Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {derivedAttachedDocs.map((doc: any, index: number) => {
                        const docUrl = getDocumentUrl(doc, selectedApplication._id);
                        const isImage = isImageAttachment(doc);
                        const isPdf = isPdfAttachment(doc);
                        const isDocument = isDocumentAttachment(doc);
                        
                        // Generate display name
                        let displayName = '';
                        if (doc.type === 'orCrCopy') {
                          displayName = doc.index ? `OR/CR Copy ${doc.index}` : 'OR/CR Copy';
                        } else if (doc.type === 'orCopy') {
                          displayName = 'Official Receipt (OR)';
                        } else if (doc.type === 'crCopy') {
                          displayName = 'Certificate of Registration (CR)';
                        } else if (doc.type === 'driversLicenseCopy') {
                          displayName = 'Driver\'s License Copy';
                        } else if (doc.type === 'authLetter') {
                          displayName = 'Authorization Letter';
                        } else if (doc.type === 'deedOfSale') {
                          displayName = 'Deed of Sale';
                        } else {
                          displayName = doc.type || 'Document';
                        }
                        
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {displayName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                              </span>
                            </div>
                            
                            {docUrl ? (
                              <div className="space-y-3">
                                {/* Image Preview */}
                                {isImage && (
                                  <div className="space-y-2">
                                    <img
                                      src={docUrl}
                                      alt={`${displayName} preview`}
                                      className="w-full h-40 object-cover rounded border cursor-zoom-in"
                                      onClick={() => handleDocumentPreview(doc)}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                
                                {/* PDF Preview */}
                                {isPdf && (
                                  <div className="space-y-2">
                                    <div 
                                      className="text-center py-6 border border-gray-200 rounded bg-gray-50 cursor-pointer hover:bg-gray-100"
                                      onClick={() => handleDocumentPreview(doc)}
                                    >
                                      <svg className="w-12 h-12 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <p className="text-sm text-gray-600">PDF Document</p>
                                      <p className="text-xs text-gray-500 mt-1">Click to preview</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Word Document Preview */}
                                {isDocument && (
                                  <div className="space-y-2">
                                    <div 
                                      className="text-center py-6 border border-gray-200 rounded bg-gray-50 cursor-pointer hover:bg-gray-100"
                                      onClick={() => handleDocumentDownload(doc)}
                                    >
                                      <svg className="w-12 h-12 mx-auto mb-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <p className="text-sm text-gray-600">Word Document</p>
                                      <p className="text-xs text-gray-500 mt-1">Click to download</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Unknown File Type */}
                                {!isImage && !isPdf && !isDocument && (
                                  <div className="space-y-2">
                                    <div 
                                      className="text-center py-6 border border-gray-200 rounded bg-gray-50 cursor-pointer hover:bg-gray-100"
                                      onClick={() => handleDocumentPreview(doc)}
                                    >
                                      <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <p className="text-sm text-gray-600">Document</p>
                                      <p className="text-xs text-gray-500 mt-1">Click to open</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex items-center justify-between">
                                  {isImage && (
                                    <button
                                      type="button"
                                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                                      onClick={() => handleDocumentPreview(doc)}
                                    >
                                      Open Preview
                                    </button>
                                  )}
                                  
                                  {isPdf && (
                                    <button
                                      type="button"
                                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                                      onClick={() => handleDocumentPreview(doc)}
                                    >
                                      Open PDF
                                    </button>
                                  )}
                                  
                                  {isDocument && (
                                    <button
                                      type="button"
                                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                                      onClick={() => handleDocumentDownload(doc)}
                                    >
                                      Download
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleDocumentDownload(doc)}
                                    className="inline-flex items-center text-sm text-[#7E0303] hover:text-[#5E0202]"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 border border-gray-200 rounded">
                                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm text-gray-500">Document not available</p>
                                <p className="text-xs text-gray-400 mt-1">URL could not be generated</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
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