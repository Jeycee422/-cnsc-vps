'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  role: string;
  name: string;
}

interface VehiclePass {
  id: string;
  status: 'active' | 'pending' | 'expired';
  expiryDate: string;
  vehicleDetails: {
    type: string;
    plateNumber: string;
    brand: string;
    model: string;
    color: string;
    year: string;
  };
}

export default function VehiclePass() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicleType: '',
    plateNumber: '',
    brand: '',
    model: '',
    color: '',
    year: '',
    purpose: '',
    duration: 'permanent',
    startDate: '',
    endDate: ''
  });

  // Mock data - replace with actual data from your backend
  const [currentPass, setCurrentPass] = useState<VehiclePass | null>({
    id: 'VP-2024-001',
    status: 'active',
    expiryDate: '2024-12-31',
    vehicleDetails: {
      type: 'Car',
      plateNumber: 'ABC-123',
      brand: 'Toyota',
      model: 'Vios',
      color: 'Silver',
      year: '2020'
    }
  });

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
    console.log('Form submitted:', formData);
    // Reset form and hide registration form
    setFormData({
      vehicleType: '',
      plateNumber: '',
      brand: '',
      model: '',
      color: '',
      year: '',
      purpose: '',
      duration: 'permanent',
      startDate: '',
      endDate: ''
    });
    setShowRegistrationForm(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Vehicle Pass</h1>
          <p className="text-gray-600">Manage your vehicle pass and registration</p>
        </div>
        {!currentPass && (
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
          >
            Register New Vehicle
          </button>
        )}
      </div>

      {currentPass ? (
        <div className="space-y-6">
          {/* Current Pass Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-medium text-gray-900">Current Vehicle Pass</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentPass.status === 'active' ? 'bg-green-100 text-green-800' :
                currentPass.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentPass.status.charAt(0).toUpperCase() + currentPass.status.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Vehicle Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-500">Vehicle Type</dt>
                    <dd className="text-gray-900">{currentPass.vehicleDetails.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Plate Number</dt>
                    <dd className="text-gray-900">{currentPass.vehicleDetails.plateNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Brand & Model</dt>
                    <dd className="text-gray-900">{currentPass.vehicleDetails.brand} {currentPass.vehicleDetails.model}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Color</dt>
                    <dd className="text-gray-900">{currentPass.vehicleDetails.color}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Year</dt>
                    <dd className="text-gray-900">{currentPass.vehicleDetails.year}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Pass Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-500">Pass ID</dt>
                    <dd className="text-gray-900">{currentPass.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Expiry Date</dt>
                    <dd className="text-gray-900">{currentPass.expiryDate}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-6 flex space-x-4">
              <button className="px-4 py-2 text-[#7E0303] border-2 border-[#7E0303] rounded-md hover:bg-[#7E0303] hover:text-white transition-colors">
                Renew Pass
              </button>
              <button className="px-4 py-2 text-[#7E0303] border-2 border-[#7E0303] rounded-md hover:bg-[#7E0303] hover:text-white transition-colors">
                Update Details
              </button>
            </div>
          </div>
        </div>
      ) : showRegistrationForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Register New Vehicle</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                >
                  <option value="">Select type</option>
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
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
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
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
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
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
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
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
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
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Purpose</label>
              <textarea
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
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
                className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
              >
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            {formData.duration === 'temporary' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
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
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 space-y-4">
              <button
                type="button"
                onClick={() => setShowRegistrationForm(false)}
                className="px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
              >
                Submit Registration
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">No Active Vehicle Pass</h2>
          <p className="text-gray-600 mb-6">You don't have an active vehicle pass. Register your vehicle to get started.</p>
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
          >
            Register New Vehicle
          </button>
        </div>
      )}
    </div>
  );
} 