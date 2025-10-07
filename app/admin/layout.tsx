'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; ts: string }>>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const pathname = usePathname();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const token = useMemo(() => (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', []);

  useEffect(() => {
    if (!token) return;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          signal: ac.signal
        });
        if (res.ok) {
          const data = await res.json();
          // Handle the response structure: { user: { id, firstName, lastName, email, role, ... } }
          if (data.user) {
            setUserRole(data.user.role || '');
            setUserEmail(data.user.email || '');
          }
        }
      } catch {}
    })();
    return () => ac.abort();
  }, [API_BASE, token]);

  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(API_BASE, { auth: { token: `Bearer ${token}` } });
    socket.on('vehiclePass:updated', ({ application }: { application: any }) => {
      if (application?.status === 'approved') {
        setNotifications(prev => [
          { id: application._id, message: `Application approved: ${application.vehicleInfo?.plateNumber || application._id}`, ts: new Date().toISOString() },
          ...prev
        ].slice(0, 20));
      }
    });
    return () => { socket.disconnect(); };
  }, [API_BASE, token]);

  const handleLogout = () => {
    try { localStorage.removeItem('token'); } catch {}
    window.location.href = '/signin';
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Applications',
      href: '/admin/applications',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Registration',
      href: '/admin/registration',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#7E0303] text-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#5E0202]">
          <div className="flex items-center space-x-2">
            <div className="relative w-10 h-10">
              <Image
                src="/cnsc-logo.png"
                alt="CNSC Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-semibold">Admin Panel</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-md hover:bg-[#5E0202] focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-5 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 mt-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-[#5E0202] text-white'
                    : 'text-gray-300 hover:bg-[#5E0202] hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded-md hover:bg-gray-100 focus:outline-none"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="relative flex items-center space-x-4">
              <div className="relative">
                {/* <button onClick={() => setIsNotifOpen(v => !v)} className="p-1 rounded-md hover:bg-gray-100 focus:outline-none">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">{notifications.length}</span>
                  )}
                </button> */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-50 max-h-96 overflow-auto">
                    <div className="p-3 border-b font-medium">Notifications</div>
                    <ul className="divide-y">
                      {notifications.length === 0 && (
                        <li className="p-3 text-sm text-gray-500">No notifications</li>
                      )}
                      {notifications.map(n => (
                        <li key={n.id} className="p-3 text-sm">
                          <div className="text-gray-800">{n.message}</div>
                          <div className="text-xs text-gray-500">{new Date(n.ts).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setIsUserMenuOpen(v => !v)} className="p-1 rounded-md hover:bg-gray-100 focus:outline-none flex items-center space-x-2">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {userEmail && (
                    <span className="text-sm text-gray-700 truncate max-w-[180px]">
                      {userEmail}
                    </span>
                  )}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border rounded-md shadow-lg z-50">
                    <div className="px-4 py-3 border-b">
                      <div className="text-sm font-medium text-gray-900 truncate">{userEmail || 'User'}</div>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 