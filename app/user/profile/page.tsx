'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  userType: string;
}

// Define the API base URL with fallback
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    userType: '',
  });

  useEffect(() => {
    const getAuthToken = (): string | null => {
      if (typeof window === 'undefined') return null;
      try {
        const fromLocalStorage = window.localStorage.getItem('token');
        if (fromLocalStorage) return fromLocalStorage;
      } catch (_) {
        // ignore
      }
      try {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const tokenCookie = cookies.find(c => c.startsWith('token='));
        if (tokenCookie) return decodeURIComponent(tokenCookie.split('=')[1]);
      } catch (_) {
        // ignore
      }
      return null;
    };

    const abortController = new AbortController();
    const fetchProfile = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const token = getAuthToken();
        if (!token) {
          setErrorMessage('You are not authenticated.');
          setIsLoading(false);
          return;
        }

        // Use the defined API_BASE instead of baseUrl
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          signal: abortController.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load profile');
        }

        const data = await res.json();
        console.log('Profile data received:', data); // Debug log
        
        // Handle the response structure: { user: { id, firstName, lastName, email, role, ... } }
        const userData = data.user || data;
        // Normalize fields from API to our User shape
        const normalized: User = {
          id: userData.id || userData._id || userData.userId || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phoneNumber || userData.phone || '',
          idNumber: userData.idNumber || userData.studentId || '',
          userType: userData.role || userData.userType || '',
        };

        setUser(normalized);
        setFormData({
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          email: normalized.email,
          phone: normalized.phone,
          idNumber: normalized.idNumber,
          userType: normalized.userType,
        });
      } catch (err: unknown) {
        // Ignore AbortError - it's expected when component unmounts
        if (err && typeof err === 'object' && (err as any).name === 'AbortError') {
          return;
        }
        console.error('Error fetching profile:', err); // Debug log
        const message = err instanceof Error ? err.message : 'Unknown error';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    return () => abortController.abort();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const token = (typeof window !== 'undefined')
      ? (window.localStorage.getItem('token') || '')
      : '';
    if (!token) {
      setErrorMessage('You are not authenticated.');
      return;
    }

    try {
      setErrorMessage('');
      // Use the defined API_BASE instead of baseUrl
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phone,
          idNumber: formData.idNumber,
          role: formData.userType,
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update profile');
      }

      const data = await res.json();
      console.log('Update response:', data); // Debug log
      
      // Handle the response structure: { user: { id, firstName, lastName, email, role, ... } }
      const userData = data.user || data;
      const updatedUser: User = {
        id: userData.id || userData._id || user.id,
        firstName: userData.firstName ?? formData.firstName,
        lastName: userData.lastName ?? formData.lastName,
        email: userData.email ?? formData.email,
        phone: userData.phoneNumber ?? userData.phone ?? formData.phone,
        idNumber: userData.idNumber ?? formData.idNumber,
        userType: userData.role ?? userData.userType ?? formData.userType,
      };
      setUser(updatedUser);
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (err: unknown) {
      // Ignore AbortError - it's expected when component unmounts
      if (err && typeof err === 'object' && (err as any).name === 'AbortError') {
        return;
      }
      console.error('Error updating profile:', err); // Debug log
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(message);
    }
  };

  if (isLoading) return <div className="space-y-6"><h1 className="text-2xl font-semibold text-gray-900">Profile</h1><div>Loading...</div></div>;
  if (errorMessage) return <div className="space-y-6"><h1 className="text-2xl font-semibold text-gray-900">Profile</h1><div className="text-red-600">{errorMessage}</div></div>;
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}