'use client';

import { useEffect, useRef, useState } from 'react';

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
    company: 'n/a',
    purpose: 'n/a',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to parse and format error messages
  const formatErrorMessage = (error: string): string => {
    // Handle authentication errors
    if (error.includes('Not authenticated') || error.includes('token') || error.includes('auth')) {
      return 'Authentication failed. Please log in again.';
    }
    
    // Handle duplicate vehicle errors
    if (error.includes('already been registered') || error.includes('An application already exists for this vehicle')) {
      return error; // These are already user-friendly from backend
    }
    
    // Handle missing fields errors
    if (error.includes('Missing required fields')) {
      return 'Please fill in all required fields.';
    }
    
    // Handle network errors
    if (error.includes('Failed to fetch') || error.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Handle server errors
    if (error.includes('Failed to create') || error.includes('server')) {
      return 'Server error. Please try again later.';
    }
    
    // Handle JSON parse errors
    if (error.includes('Unexpected token') || error.includes('JSON')) {
      return 'Invalid response from server. Please try again.';
    }
    
    // For unknown errors, show a generic message
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      setIsSubmitting(true);
      const token = (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '';
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const payload = {
        familyName: formData.applicantFamilyName,
        givenName: formData.applicantGivenName,
        middleName: formData.applicantMiddleName || undefined,
        homeAddress: formData.homeAddress,
        schoolAffiliation: formData.schoolAffiliation,
        otherAffiliation: formData.schoolAffiliation === 'other' ? (formData.otherAffiliation || undefined) : undefined,
        idNumber: formData.idNumber,
        contactNumber: formData.contactNumber,
        employmentStatus: formData.schoolAffiliation === 'personnel' ? formData.employmentStatus.toLowerCase() : undefined,
        company: formData.schoolAffiliation === 'other' ? (formData.company || undefined) : undefined,
        purpose: formData.schoolAffiliation === 'other' ? (formData.purpose || undefined) : undefined,
        guardianName: formData.schoolAffiliation === 'student' ? (formData.guardianName || undefined) : undefined,
        guardianAddress: formData.schoolAffiliation === 'student' ? (formData.guardianAddress || undefined) : undefined,
        vehicleUserType: formData.vehicleUserType,
        vehicleType: formData.vehicleType,
        plateNumber: formData.plateNumber,
        orNumber: formData.orNumber,
        crNumber: formData.crNumber,
        driverName: formData.driverName || undefined,
        driverLicense: formData.driverLicense || undefined,
      };

      const res = await fetch(`${API_BASE}/api/walkins/application`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      
      let responseData;
      const contentType = res.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `HTTP error! status: ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(responseData.error || responseData.message || `Request failed with status ${res.status}`);
      }
      
      // Success case
      setSuccessMessage('Application submitted successfully');
      setToast({ 
        message: 'Vehicle registration submitted successfully!', 
        type: 'success' 
      });
      setShowToast(true);
      
      // Reset form on success
      setFormData({
        applicantFamilyName: '',
        applicantGivenName: '',
        applicantMiddleName: '',
        homeAddress: '',
        schoolAffiliation: 'student',
        otherAffiliation: '',
        idNumber: '',
        contactNumber: '',
        employmentStatus: 'Permanent',
        company: 'n/a',
        purpose: 'n/a',
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
      
    } catch (err: unknown) {
      console.error('Submission error:', err);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (err instanceof Error) {
        errorMessage = formatErrorMessage(err.message);
      } else if (typeof err === 'string') {
        errorMessage = formatErrorMessage(err);
      }
      
      setErrorMessage(errorMessage);
      setToast({ 
        message: errorMessage, 
        type: 'error' 
      });
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">On-Site Registration</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {showToast && (
          <div className={`fixed top-6 right-6 z-50 min-w-[280px] max-w-sm rounded-md shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start p-4">
              <div className={`mr-3 mt-0.5 ${
                toast.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 text-sm text-gray-800">{toast.message}</div>
              <button 
                onClick={() => setShowToast(false)} 
                className="ml-3 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
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
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
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
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700">
                  {formData.schoolAffiliation === 'student' ? 'Student No.' : 
                   formData.schoolAffiliation === 'personnel' ? 'Employee No.' : 'ID Number'}
                </label>
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
                  placeholder="e.g., ABC123"
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
                <label htmlFor="crNumber" className="block text-sm font-medium text-gray-700">C.R. Number</label>
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

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] disabled:opacity-60 focus:outline-none"
            >
              {isSubmitting ? 'Submitting...' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}