'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Document {
  id: string;
  name: string;
  file: File;
  type: 'orcr' | 'license';
}

export default function Registration() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    userType: 'student', // student, faculty, staff, visitor
    vehicleType: 'car', // car, motorcycle, other
    plateNumber: '',
    brand: '',
    model: '',
    color: '',
    year: '',
    purpose: '',
    duration: 'temporary', // temporary, permanent
    startDate: '',
    endDate: '',
  });

  const [documents, setDocuments] = useState<Document[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], type: 'orcr' | 'license') => {
    const newDocuments = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      type
    }));
    setDocuments(prev => [...prev, ...newDocuments]);
  }, []);

  const { getRootProps: getOrcrRootProps, getInputProps: getOrcrInputProps, isDragActive: isOrcrDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, 'orcr'),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5242880 // 5MB
  });

  const { getRootProps: getLicenseRootProps, getInputProps: getLicenseInputProps, isDragActive: isLicenseDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, 'license'),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5242880 // 5MB
  });

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', { ...formData, documents });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Online Registration</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700">ID Number</label>
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
              <div>
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700">User Type</label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="staff">Staff</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="other">Other</option>
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
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="text"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
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
                              ({doc.type === 'orcr' ? 'ORCR' : 'Driver\'s License'})
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

          {/* Pass Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pass Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Purpose</label>
                <textarea
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration</label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                >
                  <option value="temporary">Temporary</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              {formData.duration === 'temporary' && (
                <>
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
            >
              Submit Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 