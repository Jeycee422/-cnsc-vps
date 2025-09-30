'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    affiliation: 'others',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName || undefined,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          affiliation: formData.affiliation,
          password: formData.password
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Registration failed');
      }

      const data = await res.json();
      setSuccessMessage('Account created successfully. You can now sign in.');
      // Optionally auto-login if API returns token
      if (data && data.token) {
        try { localStorage.setItem('token', data.token); } catch (_) {}
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
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
                  <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">Middle Name (optional)</label>
                  <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
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
                <label htmlFor="affiliation" className="block text-sm font-medium text-gray-700">Affiliation</label>
                <select
                  id="affiliation"
                  name="affiliation"
                  value={formData.affiliation}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 py-3 px-4 focus:border-[#7E0303] focus:ring-0 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_1rem_center] bg-no-repeat pr-10"
                >
                  <option value="student">student</option>
                  <option value="personnel">personnel</option>
                  <option value="others">others</option>
                </select>
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

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
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

            {(errorMessage || successMessage) && (
              <div className={`text-sm ${errorMessage ? 'text-red-600' : 'text-green-600'}`}>
                {errorMessage || successMessage}
              </div>
            )}

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
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7E0303] hover:bg-[#5E0202] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7E0303]"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
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