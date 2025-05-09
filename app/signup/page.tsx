'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    idNumber: '',
    phoneNumber: '',
    userType: 'student' // default value
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#554C4C] via-[#7E0303] to-[#7E0303] text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-4">
            <div className="relative w-20 h-20">
              <Image
                src="/cnsc-logo.png"
                alt="CNSC Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold">CNSC Vehicle Pass System</h1>
          </Link>
        </div>
      </header>

      {/* Sign Up Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-[#7E0303] mb-6 text-center">Create Your Account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
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
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700">User Type</label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_1rem_center] bg-no-repeat pr-10"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="staff">Staff</option>
                  <option value="visitor">Visitor</option>
                </select>
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
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Account Security */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#7E0303]">Account Security</h3>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-5 w-5 text-[#7E0303] focus:ring-0 border-2 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the <Link href="/terms" className="text-[#7E0303] hover:text-[#5E0202]">Terms and Conditions</Link>
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7E0303] hover:bg-[#5E0202] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7E0303]"
              >
                Create Account
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/signin" className="font-medium text-[#7E0303] hover:text-[#5E0202]">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
} 