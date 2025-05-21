'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Hardcoded users for demonstration
const users = {
  'admin@email.com': {
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  'student@email.com': {
    password: 'student123',
    role: 'student',
    name: 'John Student'
  },
  'faculty@email.com': {
    password: 'faculty123',
    role: 'faculty',
    name: 'Jane Faculty'
  },
  'staff@email.com': {
    password: 'staff123',
    role: 'staff',
    name: 'Mike Staff'
  }
};

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');

  // useEffect(() => {
  //   // Check if user is already logged in
  //   const userData = localStorage.getItem('user');
  //   if (userData) {
  //     const user = JSON.parse(userData);
  //     if (user.role === 'admin') {
  //       router.push('/admin/dashboard');
  //     } else {
  //       router.push('/user/home');
  //     }
  //   }
  // }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users[formData.email as keyof typeof users];

    if (!user || user.password !== formData.password) {
      setError('Invalid email or password');
      return;
    }

    // Store user info in localStorage
    // const userData = {
    //   email: formData.email,
    //   role: user.role,
    //   name: user.name
    // };
    // localStorage.setItem('user', JSON.stringify(userData));

    // Redirect based on role
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/user/home');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

      {/* Sign In Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-[#7E0303] mb-6 text-center">Sign In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-5 w-5 text-[#7E0303] focus:ring-0 border-2 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-[#7E0303] hover:text-[#5E0202]">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7E0303] hover:bg-[#5E0202] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7E0303]"
              >
                Sign In
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-[#7E0303] hover:text-[#5E0202]">
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Admin: admin@email.com / admin123</p>
              <p>Student: student@email.com / student123</p>
              <p>Faculty: faculty@email.com / faculty123</p>
              <p>Staff: staff@email.com / staff123</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 