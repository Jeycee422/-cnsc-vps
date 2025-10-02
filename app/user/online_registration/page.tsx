'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

interface Document {
  id: string;
  name: string;
  file: File;
  type: 'orCrCopy' | 'driversLicenseCopy';
}

export default function Registration() {
  const [formData, setFormData] = useState({
    applicantFamilyName: '',
    applicantGivenName: '',
    applicantMiddleName: '',
    homeAddress: '',
    schoolAffiliation: 'student',
    otherAffiliation: '',
    idNumber: '',
    contactNumber: '',
    employmentStatus: 'Permanent',
    company: '',
    purpose: '',
    guardianName: '',
    guardianAddress: '',
    vehicleUserType: 'owner',
    vehicleType: 'motorcycle',
    plateNumber: '',
    orNumber: '',
    crNumber: '',
    driverName: '',
    driverLicense: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAffiliationLocked, setIsAffiliationLocked] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for edit mode and load application data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isEdit = urlParams.get('edit') === 'true';
    
    if (isEdit) {
      setIsEditMode(true);
      try {
        const editingData = localStorage.getItem('editingApplication');
        if (editingData) {
          const application = JSON.parse(editingData);
          setEditingApplicationId(application.id || application._id);
          
          // Populate form with existing application data
          setFormData(prev => ({
            ...prev,
            applicantFamilyName: application.applicant?.familyName || prev.applicantFamilyName,
            applicantGivenName: application.applicant?.givenName || prev.applicantGivenName,
            applicantMiddleName: application.applicant?.middleName || prev.applicantMiddleName,
            homeAddress: application.applicant?.homeAddress || prev.homeAddress,
            schoolAffiliation: application.applicant?.schoolAffiliation || prev.schoolAffiliation,
            otherAffiliation: application.applicant?.otherAffiliation || prev.otherAffiliation,
            idNumber: application.applicant?.idNumber || prev.idNumber,
            contactNumber: application.applicant?.contactNumber || prev.contactNumber,
            employmentStatus: application.applicant?.employmentStatus || prev.employmentStatus,
            company: application.applicant?.company || prev.company,
            purpose: application.applicant?.purpose || prev.purpose,
            guardianName: application.applicant?.guardianName || prev.guardianName,
            guardianAddress: application.applicant?.guardianAddress || prev.guardianAddress,
            vehicleUserType: application.vehicleUserType || prev.vehicleUserType,
            vehicleType: application.vehicleInfo?.type || application.vehicleDetails?.type || prev.vehicleType,
            plateNumber: application.vehicleInfo?.plateNumber || application.vehicleDetails?.plateNumber || prev.plateNumber,
            orNumber: application.vehicleInfo?.orNumber || prev.orNumber,
            crNumber: application.vehicleInfo?.crNumber || prev.crNumber,
            driverName: application.driverName || prev.driverName,
            driverLicense: application.driverLicense || prev.driverLicense,
          }));
          
          // Lock affiliation if it was previously set
          if (application.applicant?.schoolAffiliation === 'student' || application.applicant?.schoolAffiliation === 'personnel') {
            setIsAffiliationLocked(true);
          }
        }
      } catch (error) {
        console.error('Failed to load application for editing:', error);
        setToast({ message: 'Failed to load application for editing', type: 'error' });
        setShowToast(true);
      }
    }
  }, []);

  // Prefill from authenticated user profile (only if not in edit mode)
  useEffect(() => {
    if (isEditMode) return; // Skip user prefill if editing
    
    const ac = new AbortController();
    const token = (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '';
    if (!token) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const load = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          signal: ac.signal
        });
        if (!res.ok) return;
        const data = await res.json();
        // Handle the response structure: { user: { id, firstName, lastName, email, role, ... } }
        const userData = data.user || data;
        setFormData(prev => ({
          ...prev,
          applicantFamilyName: userData.lastName || prev.applicantFamilyName,
          applicantGivenName: userData.firstName || prev.applicantGivenName,
          applicantMiddleName: userData.middleName || prev.applicantMiddleName,
          homeAddress: userData.address || prev.homeAddress,
          schoolAffiliation: (userData.affiliation === 'others' ? 'other' : (userData.affiliation || prev.schoolAffiliation)),
          contactNumber: userData.phoneNumber || userData.phone || prev.contactNumber,
          idNumber: userData.idNumber || prev.idNumber,
        }));
        const aff = (userData.affiliation || '').toLowerCase();
        if (aff === 'student' || aff === 'personnel') {
          setIsAffiliationLocked(true);
        }
      } catch (_) {
        // ignore prefill errors
      }
    };
    load();
    return () => ac.abort();
  }, [isEditMode]);

  useEffect(() => {
    if (showToast) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setShowToast(false);
      }, 4000);
    }
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [showToast]);

  // Removed dummy autofill; use real user context if needed

  const [documents, setDocuments] = useState<Document[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], type: 'orCrCopy' | 'driversLicenseCopy') => {
    const newDocuments = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      type
    }));
    setDocuments(prev => [...prev, ...newDocuments]);
  }, []);

  const { getRootProps: getOrcrRootProps, getInputProps: getOrcrInputProps, isDragActive: isOrcrDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, 'orCrCopy'),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5242880 // 5MB
  });

  const { getRootProps: getLicenseRootProps, getInputProps: getLicenseInputProps, isDragActive: isLicenseDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, 'driversLicenseCopy'),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5242880 // 5MB
  });

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getUserFriendlyErrorMessage = (errorMessage: string): string => {
    const lowerMessage = errorMessage.toLowerCase();
    
    // Document-related errors
    if (lowerMessage.includes('no files') || lowerMessage.includes('missing files')) {
      return 'Please upload all required documents (OR/CR and Driver\'s License)';
    }
    if (lowerMessage.includes('file') && lowerMessage.includes('required')) {
      return 'Please upload all required documents';
    }
    if (lowerMessage.includes('file size') || lowerMessage.includes('too large')) {
      return 'File size is too large. Please upload files smaller than 5MB';
    }
    if (lowerMessage.includes('file type') || lowerMessage.includes('invalid format')) {
      return 'Invalid file format. Please upload PNG, JPG, or PDF files only';
    }
    
    // Form validation errors
    if (lowerMessage.includes('required') && lowerMessage.includes('field')) {
      return 'Please fill in all required fields';
    }
    if (lowerMessage.includes('email') && lowerMessage.includes('invalid')) {
      return 'Please enter a valid email address';
    }
    if (lowerMessage.includes('phone') && lowerMessage.includes('invalid')) {
      return 'Please enter a valid phone number';
    }
    if (lowerMessage.includes('plate number') && lowerMessage.includes('invalid')) {
      return 'Please enter a valid plate number';
    }
    
    // Authentication errors
    if (lowerMessage.includes('not authenticated') || lowerMessage.includes('unauthorized')) {
      return 'Your session has expired. Please sign in again';
    }
    if (lowerMessage.includes('token') && lowerMessage.includes('invalid')) {
      return 'Your session has expired. Please sign in again';
    }
    
    // Server errors
    if (lowerMessage.includes('server error') || lowerMessage.includes('internal error')) {
      return 'Something went wrong on our end. Please try again later';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'Network connection error. Please check your internet connection and try again';
    }
    
    // Duplicate application
    if (lowerMessage.includes('already exists') || lowerMessage.includes('duplicate')) {
      return 'You have already submitted an application for this vehicle';
    }
    
    // Generic fallback
    if (lowerMessage.includes('failed to submit') || lowerMessage.includes('submission failed')) {
      return 'Failed to submit application. Please check all fields and try again';
    }
    
    // If no specific pattern matches, return a generic friendly message
    return 'Something went wrong. Please check your information and try again';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'schoolAffiliation' && isAffiliationLocked) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validate required documents
    const orcrDocuments = documents.filter(doc => doc.type === 'orCrCopy');
    const licenseDocuments = documents.filter(doc => doc.type === 'driversLicenseCopy');
    
    if (orcrDocuments.length === 0) {
      setToast({ message: 'Please upload your OR/CR document', type: 'error' });
      setShowToast(true);
      return;
    }
    
    if (licenseDocuments.length === 0) {
      setToast({ message: 'Please upload your driver\'s license', type: 'error' });
      setShowToast(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const token = (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '';
      if (!token) throw new Error('Not authenticated');

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const body = new FormData();

      body.append('applicant[familyName]', formData.applicantFamilyName);
      body.append('applicant[givenName]', formData.applicantGivenName);
      if (formData.applicantMiddleName) body.append('applicant[middleName]', formData.applicantMiddleName);
      body.append('homeAddress', formData.homeAddress);
      body.append('schoolAffiliation', formData.schoolAffiliation);
      if (formData.schoolAffiliation === 'other' && formData.otherAffiliation) body.append('otherAffiliation', formData.otherAffiliation);
      body.append('idNumber', formData.idNumber);
      body.append('contactNumber', formData.contactNumber);
      body.append('employmentStatus', formData.employmentStatus.toLowerCase());
      if (formData.company) body.append('company', formData.company);
      if (formData.purpose) body.append('purpose', formData.purpose);
      if (formData.guardianName) body.append('guardianName', formData.guardianName);
      if (formData.guardianAddress) body.append('guardianAddress', formData.guardianAddress);

      body.append('vehicleUserType', formData.vehicleUserType);
      body.append('vehicleInfo[type]', formData.vehicleType);
      body.append('vehicleInfo[plateNumber]', formData.plateNumber);
      if (formData.orNumber) body.append('vehicleInfo[orNumber]', formData.orNumber);
      if (formData.crNumber) body.append('vehicleInfo[crNumber]', formData.crNumber);
      if (formData.driverName) body.append('driverName', formData.driverName);
      if (formData.driverLicense) body.append('driverLicense', formData.driverLicense);

      documents.forEach((doc) => {
        body.append(doc.type, doc.file, doc.name);
      });

      const url = isEditMode && editingApplicationId 
        ? `${API_BASE}/api/vehicle-passes/application/${editingApplicationId}`
        : `${API_BASE}/api/vehicle-passes/application`;
      
      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body
      });
      if (!res.ok) {
        let errorMessage = 'Failed to submit application';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || errorData.details || 'Failed to submit application';
        } catch {
          try {
            const text = await res.text();
            errorMessage = text || 'Failed to submit application';
          } catch {
            errorMessage = 'Failed to submit application';
          }
        }
        throw new Error(errorMessage);
      }
      await res.json();
      const successMessage = isEditMode ? 'Application updated successfully' : 'Application submitted successfully';
      setSuccessMessage(successMessage);
      setToast({ message: successMessage, type: 'success' });
      setShowToast(true);
      
      // Clear edit mode after successful update
      if (isEditMode) {
        localStorage.removeItem('editingApplication');
      }
      
      // Redirect to vehicle pass page after successful submission/update
      setTimeout(() => {
        window.location.href = '/user/pass';
      }, 2000);
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : 'Unknown error';
      const friendlyMessage = getUserFriendlyErrorMessage(rawMessage);
      setErrorMessage(friendlyMessage);
      setToast({ message: friendlyMessage, type: 'error' });
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Application' : 'Online Registration'}
        </h1>
        {isEditMode && (
          <div className="text-sm text-gray-600">
            Editing rejected application
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {showToast && (
          <div className={`fixed top-6 right-6 z-50 min-w-[280px] max-w-sm rounded-md shadow-lg border ${toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start p-4">
              <div className={`mr-3 mt-0.5 ${toast.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"/></svg>
                )}
              </div>
              <div className="flex-1 text-sm text-gray-800">{toast.message}</div>
              <button onClick={() => setShowToast(false)} className="ml-3 text-gray-500 hover:text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Applicant Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Applicant Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="applicantFamilyName" className="block text-sm font-medium text-gray-700">Family Name</label>
                <input
                  type="text"
                  id="applicantFamilyName"
                  name="applicantFamilyName"
                  value={formData.applicantFamilyName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="applicantGivenName" className="block text-sm font-medium text-gray-700">Given Name</label>
                <input
                  type="text"
                  id="applicantGivenName"
                  name="applicantGivenName"
                  value={formData.applicantGivenName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="applicantMiddleName" className="block text-sm font-medium text-gray-700">Middle Name</label>
                <input
                  type="text"
                  id="applicantMiddleName"
                  name="applicantMiddleName"
                  value={formData.applicantMiddleName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div className="md:col-span-3">
                <label htmlFor="homeAddress" className="block text-sm font-medium text-gray-700">Home Address</label>
                <input
                  type="text"
                  id="homeAddress"
                  name="homeAddress"
                  value={formData.homeAddress}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="schoolAffiliation" className="block text-sm font-medium text-gray-700">School's Affiliation</label>
                <select
                  id="schoolAffiliation"
                  name="schoolAffiliation"
                  value={formData.schoolAffiliation}
                  onChange={handleChange}
                  required
                  disabled={isAffiliationLocked}
                  className={`mt-1 block w-full rounded-md border-2 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none ${isAffiliationLocked ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`}
                >
                  <option value="student">Student</option>
                  <option value="personnel">Personnel</option>
                  <option value="other">Others (Please Specify)</option>
                </select>
              </div>
              {formData.schoolAffiliation === 'other' && (
              <div className="md:col-span-2">
                <label htmlFor="otherAffiliation" className="block text-sm font-medium text-gray-700">Others (Please Specify)</label>
                <input
                  type="text"
                  id="otherAffiliation"
                  name="otherAffiliation"
                  value={formData.otherAffiliation}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              )}
              <div className="md:col-span-1">
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700">{formData.schoolAffiliation === 'student' ? 'Student No.' : (formData.schoolAffiliation === 'personnel' ? 'Employee No.' : 'ID Number')}</label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              {formData.schoolAffiliation === 'personnel' && (
              <div className="md:col-span-1">
                <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700">Status of Employment</label>
                <select
                  id="employmentStatus"
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Casual">Casual</option>
                  <option value="Job Order">Job Order</option>
                </select>
              </div>
              )}
              {formData.schoolAffiliation === 'other' && (
                <>
                  <div className="md:col-span-1">
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">Other Applicant: Company</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Other Applicant: Purpose</label>
                    <textarea
                      id="purpose"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                    />
                  </div>
                </>
              )}
              {formData.schoolAffiliation === 'student' && (
              <div className="md:col-span-1">
                <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700">Name of Parent/Guardian (for student applicant)</label>
                <input
                  type="text"
                  id="guardianName"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              )}
              {formData.schoolAffiliation === 'student' && (
              <div className="md:col-span-2">
                <label htmlFor="guardianAddress" className="block text-sm font-medium text-gray-700">Parent's/Guardian Address</label>
                <input
                  type="text"
                  id="guardianAddress"
                  name="guardianAddress"
                  value={formData.guardianAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Type of Vehicle</label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="suv">SUV</option>
                  <option value="tricycle">Tricycle</option>
                  <option value="double_cab">Double Cab</option>
                  <option value="single_cab">Single Cab</option>
                  <option value="heavy_truck">Heavy Truck</option>
                  <option value="heavy_equipment">Heavy Equipment</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="e_vehicle">E-Vehicle</option>
                </select>
              </div>
              <div>
                <label htmlFor="vehicleUserType" className="block text-sm font-medium text-gray-700">Vehicle User ID</label>
                <select
                  id="vehicleUserType"
                  name="vehicleUserType"
                  value={formData.vehicleUserType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                >
                  <option value="owner">Vehicle Owner</option>
                  <option value="driver">Vehicle Driver</option>
                  <option value="passenger">Vehicle Passenger/User</option>
                </select>
              </div>
              <div>
                <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700">Plate Number</label>
                <input
                  type="text"
                  id="plateNumber"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="orNumber" className="block text-sm font-medium text-gray-700">O.R. Number</label>
                <input
                  type="text"
                  id="orNumber"
                  name="orNumber"
                  value={formData.orNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="crNumber" className="block text sm font-medium text-gray-700">C.R. Number</label>
                <input
                  type="text"
                  id="crNumber"
                  name="crNumber"
                  value={formData.crNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="driverName" className="block text-sm font-medium text-gray-700">Driver's Name</label>
                <input
                  type="text"
                  id="driverName"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="driverLicense" className="block text-sm font-medium text-gray-700">Driver's License</label>
                <input
                  type="text"
                  id="driverLicense"
                  name="driverLicense"
                  value={formData.driverLicense}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h2>
            <p className="text-sm text-gray-600 mb-4">Upload your ORCR and driver's license. Maximum file size: 5MB</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ORCR Upload */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">ORCR Document</h3>
                <div
                  {...getOrcrRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isOrcrDragActive ? 'border-[#7E0303] bg-red-50' : 'border-gray-300 hover:border-[#7E0303]'
                  }`}
                >
                  <input {...getOrcrInputProps()} />
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="text-sm text-gray-600">
                      {isOrcrDragActive ? (
                        <p>Drop the ORCR here ...</p>
                      ) : (
                        <p>
                          Drag and drop your ORCR here, or{' '}
                          <span className="text-[#7E0303] font-medium">click to select file</span>
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Driver's License Upload */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Driver's License</h3>
                <div
                  {...getLicenseRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isLicenseDragActive ? 'border-[#7E0303] bg-red-50' : 'border-gray-300 hover:border-[#7E0303]'
                  }`}
                >
                  <input {...getLicenseInputProps()} />
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="text-sm text-gray-600">
                      {isLicenseDragActive ? (
                        <p>Drop the license here ...</p>
                      ) : (
                        <p>
                          Drag and drop your license here, or{' '}
                          <span className="text-[#7E0303] font-medium">click to select file</span>
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document List */}
            {documents.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Uploaded Documents</h3>
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.name}
                            <span className="ml-2 text-xs text-gray-500">
                              ({doc.type === 'orCrCopy' ? 'OR/CR' : 'Driver\'s License'})
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pass Information removed for user online registration */}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 text-white rounded-md transition-colors ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#7E0303] hover:bg-[#5E0202]'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{isEditMode ? 'Updating...' : 'Submitting...'}</span>
                </div>
              ) : (
                isEditMode ? 'Update Application' : 'Submit Registration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 