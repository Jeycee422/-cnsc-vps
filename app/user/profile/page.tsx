'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  role: string;
  name: string;
  idNumber: string;
  phoneNumber: string;
  department?: string;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    idNumber: '',
    phoneNumber: '',
    department: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // useEffect(() => {
  //   // Check if user is logged in
  //   const userData = localStorage.getItem('user');
  //   if (!userData) {
  //     router.push('/signin');
  //     return;
  //   }

  //   const user = JSON.parse(userData);
  //   setUser(user);
  //   // Initialize form data with user data
  //   setFormData(prev => ({
  //     ...prev,
  //     name: user.name || '',
  //     email: user.email || '',
  //     idNumber: user.idNumber || '',
  //     phoneNumber: user.phoneNumber || '',
  //     department: user.department || ''
  //   }));
  // }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically make an API call to update the user's information
    console.log('Form submitted:', formData);
    
    if (!user) return;
    
    // For demo purposes, update the local storage
    const updatedUser: User = {
      ...user,
      name: formData.name,
      email: formData.email,
      idNumber: formData.idNumber,
      phoneNumber: formData.phoneNumber,
      department: formData.department,
      role: user.role
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Profile updated successfully!' });
    
    // Clear password fields
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-[#7E0303] border-2 border-[#7E0303] rounded-md hover:bg-[#7E0303] hover:text-white transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
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
                  disabled={!isEditing}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {user.role === 'student' && (
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              )}
            </div>

            {isEditing && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 py-2 px-3 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage({ type: '', text: '' });
                  }}
                  className="px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7E0303] text-white rounded-md hover:bg-[#5E0202] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 