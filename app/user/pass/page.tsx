'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  role: string;
  name: string;
}

interface VehiclePass {
  id: string;
  _id?: string; // MongoDB ID
  status: 'pending' | 'approved' | 'registered' | 'rejected' | 'expired';
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
  rejectionReason?: string;
  vehicleInfo?: {
    type?: string;
    plateNumber?: string;
    brand?: string;
    model?: string;
    color?: string;
    year?: string;
    orNumber?: string;
    crNumber?: string;
  };
  vehicleDetails?: {
    type?: string;
    plateNumber?: string;
    brand?: string;
    model?: string;
    color?: string;
    year?: string;
  };
  applicant?: {
    familyName?: string;
    givenName?: string;
    middleName?: string;
    homeAddress?: string;
    schoolAffiliation?: string;
    otherAffiliation?: string;
    idNumber?: string;
    contactNumber?: string;
    employmentStatus?: string;
    company?: string;
    purpose?: string;
    guardianName?: string;
    guardianAddress?: string;
  };
  vehicleUserType?: string;
  driverName?: string;
  driverLicense?: string;
}

export default function VehiclePass() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [passes, setPasses] = useState<VehiclePass[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  const token = useMemo(() => (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', []);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    // Authenticate via token + /api/auth/me instead of relying on localStorage 'user'
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
          // Only redirect on explicit auth failures
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
          name: [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') || u.name || '',
        };
        setUser(composedUser);
        if (composedUser.role === 'admin' || composedUser.role === 'super_admin') {
          router.push('/admin/dashboard');
          return;
        }
        // Redirect security guards to security interface
        if (composedUser.role === 'security_guard') {
          router.push('/security/scans');
          return;
        }
      } catch (err) {
        // Ignore aborts
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
    const ac = new AbortController();
    const load = async () => {
      if (!token) {
        setIsLoading(false);
        setErrorMessage('Not authenticated');
        return;
      }
      setIsLoading(true);
      setErrorMessage('');
      try {
        // Fetch user's passes/applications
        const res = await fetch(`${API_BASE}/api/vehicle-passes/my-applications`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          signal: ac.signal,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load passes');
        }
        const data = await res.json();
        const list: VehiclePass[] = data.passes || data.applications || [];
        setPasses(list);
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

  const handleEditApplication = (application: VehiclePass) => {
    // Store application data in localStorage for editing
    try {
      localStorage.setItem('editingApplication', JSON.stringify(application));
      router.push('/user/online_registration?edit=true');
    } catch (error) {
      console.error('Failed to store application data:', error);
      alert('Failed to load application for editing. Please try again.');
    }
  };

  const handlePrintApplication = (application: VehiclePass) => {
    // Create a printable document with all application data
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the application');
      return;
    }

    const applicationData = {
      ...application,
      applicantName: application.applicant ? 
        `${application.applicant.givenName || ''} ${application.applicant.middleName || ''} ${application.applicant.familyName || ''}`.trim() : 
        'N/A',
      vehicleType: getVehicleTypeLabel(application.vehicleInfo?.type || application.vehicleDetails?.type),
      plateNumber: application.vehicleInfo?.plateNumber || application.vehicleDetails?.plateNumber || 'N/A',
      orNumber: application.vehicleInfo?.orNumber || 'N/A',
      crNumber: application.vehicleInfo?.crNumber || 'N/A',
      applicationDate: application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A',
      expiryDate: application.expiryDate ? new Date(application.expiryDate).toLocaleDateString() : 'N/A'
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vehicle Pass Application - ${applicationData.plateNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7E0303; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #7E0303; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; color: #7E0303; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .field { margin-bottom: 10px; }
          .field-label { font-weight: bold; display: inline-block; width: 200px; }
          .field-value { display: inline-block; }
          .status { padding: 5px 10px; border-radius: 15px; font-weight: bold; }
          .status-approved { background-color: #d4edda; color: #155724; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">CNSC Vehicle Pass System</div>
          <h1>Vehicle Pass Application</h1>
          <div class="status status-approved">APPROVED</div>
        </div>

        <div class="section">
          <div class="section-title">Application Information</div>
          <div class="field"><span class="field-label">Application ID:</span> <span class="field-value">${applicationData.id || applicationData._id || 'N/A'}</span></div>
          <div class="field"><span class="field-label">Application Date:</span> <span class="field-value">${applicationData.applicationDate}</span></div>
          <div class="field"><span class="field-label">Status:</span> <span class="field-value">${applicationData.status.toUpperCase()}</span></div>
          <div class="field"><span class="field-label">Expiry Date:</span> <span class="field-value">${applicationData.expiryDate}</span></div>
        </div>

        <div class="section">
          <div class="section-title">Applicant Information</div>
          <div class="field"><span class="field-label">Full Name:</span> <span class="field-value">${applicationData.applicantName}</span></div>
          <div class="field"><span class="field-label">Home Address:</span> <span class="field-value">${applicationData.applicant?.homeAddress || 'N/A'}</span></div>
          <div class="field"><span class="field-label">School Affiliation:</span> <span class="field-value">${applicationData.applicant?.schoolAffiliation || 'N/A'}</span></div>
          <div class="field"><span class="field-label">ID Number:</span> <span class="field-value">${applicationData.applicant?.idNumber || 'N/A'}</span></div>
          <div class="field"><span class="field-label">Contact Number:</span> <span class="field-value">${applicationData.applicant?.contactNumber || 'N/A'}</span></div>
          ${applicationData.applicant?.employmentStatus ? `<div class="field"><span class="field-label">Employment Status:</span> <span class="field-value">${applicationData.applicant.employmentStatus}</span></div>` : ''}
          ${applicationData.applicant?.company ? `<div class="field"><span class="field-label">Company:</span> <span class="field-value">${applicationData.applicant.company}</span></div>` : ''}
          ${applicationData.applicant?.guardianName ? `<div class="field"><span class="field-label">Guardian Name:</span> <span class="field-value">${applicationData.applicant.guardianName}</span></div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">Vehicle Information</div>
          <div class="field"><span class="field-label">Vehicle Type:</span> <span class="field-value">${applicationData.vehicleType}</span></div>
          <div class="field"><span class="field-label">Plate Number:</span> <span class="field-value">${applicationData.plateNumber}</span></div>
          <div class="field"><span class="field-label">O.R. Number:</span> <span class="field-value">${applicationData.orNumber}</span></div>
          <div class="field"><span class="field-label">C.R. Number:</span> <span class="field-value">${applicationData.crNumber}</span></div>
          <div class="field"><span class="field-label">Vehicle User Type:</span> <span class="field-value">${applicationData.vehicleUserType || 'N/A'}</span></div>
          ${applicationData.driverName ? `<div class="field"><span class="field-label">Driver Name:</span> <span class="field-value">${applicationData.driverName}</span></div>` : ''}
          ${applicationData.driverLicense ? `<div class="field"><span class="field-label">Driver License:</span> <span class="field-value">${applicationData.driverLicense}</span></div>` : ''}
        </div>

        <div class="footer">
          <p>This document was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>CNSC Vehicle Pass System - Official Document</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!authChecked) return <div className="bg-white rounded-lg shadow p-6">Loading...</div>;

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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Vehicle Pass</h1>
          <p className="text-gray-600">Manage your vehicle pass and registration</p>
        </div>
        {passes.length === 0 && (
          <button
            onClick={() => router.push('/user/online_registration')}
            className="px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
          >
            Apply for Vehicle Pass
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">Loading...</div>
      ) : errorMessage ? (
        <div className="bg-white rounded-lg shadow p-6 text-red-600">{errorMessage}</div>
      ) : passes.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {passes.map((p, index) => {
                    const vehType = p.vehicleInfo?.type || p.vehicleDetails?.type || '';
                    const plate = p.vehicleInfo?.plateNumber || p.vehicleDetails?.plateNumber || '';
                    const displayStatus = p.status === 'registered' ? 'active' : p.status;
                    const statusColor = displayStatus === 'active'
                      ? 'bg-green-100 text-green-800'
                      : displayStatus === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : displayStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : displayStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800';
                    
                    // Use a combination of ID and index to ensure unique keys
                    const uniqueKey = p.id || p._id || `pass-${index}`;
                    
                    return (
                      <tr key={uniqueKey} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-sm text-gray-900">{getVehicleTypeLabel(vehType)}</div>
                          <div className="text-sm text-gray-500">{plate || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="space-y-2">
                            {p.status === 'rejected' && p.rejectionReason && (
                              <div className="text-xs text-red-600 mb-1">
                                Reason: {p.rejectionReason}
                              </div>
                            )}
                            <div className="flex space-x-2">
                              {p.status === 'rejected' && (
                                <button
                                  onClick={() => handleEditApplication(p)}
                                  className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
                                >
                                  Edit Application
                                </button>
                              )}
                              {p.status === 'approved' && (
                                <button
                                  onClick={() => handlePrintApplication(p)}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                >
                                  Print Pass
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Active Vehicle Pass</h2>
            <p className="text-gray-600 mb-4">You don't have an active vehicle pass yet.</p>
            <p className="text-sm text-gray-500 mb-6">Apply for a vehicle pass to access campus with your vehicle.</p>
          </div>
          <button
            onClick={() => router.push('/user/online_registration')}
            className="px-6 py-3 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors font-medium"
          >
            Apply for Vehicle Pass
          </button>
        </div>
      )}
    </div>
    </>
  );
} 