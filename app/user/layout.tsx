'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ref, onValue, off, query, orderByChild, equalTo, get } from 'firebase/database';
import { db } from '@/lib/firebase-client';
import { jwtDecode } from 'jwt-decode';

// Define types for better TypeScript support
interface NotificationData {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | string;
  data?: {
    vehiclePlate?: string;
    vehicleType?: string;
    applicationId?: string;
    tagId?: string;
    assignedAt?: string;
    validUntil?: string;
    status?: string;
  };
  createdAt: number;
  read?: boolean;
  userId?: string;
}

interface Notification extends NotificationData {
  id: string;
}

const navigation = [
  { 
    name: 'Home', 
    href: '/user/home',
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    name: 'My Vehicle Pass', 
    href: '/user/pass',
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  { 
    name: 'Profile', 
    href: '/user/profile',
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  { 
    name: 'Online Application', 
    href: '/user/online_registration',
    icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
  },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  // Get token from localStorage
  const token = useMemo(() => 
    (typeof window !== 'undefined') ? (localStorage.getItem('token') || '') : '', 
  []);

  // Get current user ID from token
  const getCurrentUserId = useMemo(() => {
    if (!token) return null;
    
    try {
      const decoded = jwtDecode(token) as { userId?: string; _id?: string; id?: string };
      return decoded.userId || decoded._id || decoded.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, [token]);

  useEffect(() => {
    const userId = getCurrentUserId;
    console.log('[notifications] init', {
      userId,
      dbURL: (typeof window !== 'undefined') ? (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'env not set') : 'ssr'
    });
    if (!userId) {
      console.log('[notifications] skipped: no userId decoded from token');
      return;
    }

    const perUserRef = ref(db, `notifications/${userId}`);
    const userNestedRef = ref(db, `users/${userId}/notifications`);
    const rootByUserQuery = query(ref(db, 'notifications'), orderByChild('userId'), equalTo(userId));

    // One-time debug reads
    get(perUserRef).then(s => console.log('[notifications][debug get] perUserRef', s.val())).catch(err => console.warn('[notifications][debug get] perUserRef error', err?.message));
    get(userNestedRef).then(s => console.log('[notifications][debug get] userNestedRef', s.val())).catch(err => console.warn('[notifications][debug get] userNestedRef error', err?.message));
    get(ref(db, 'notifications')).then(s => console.log('[notifications][debug get] root notifications', s.val())).catch(err => console.warn('[notifications][debug get] root error', err?.message));

    const collect = (obj: Record<string, NotificationData> | null, prefix: string) => {
      const out: Notification[] = [];
      if (!obj) return out;
      for (const [k, v] of Object.entries(obj)) {
        const createdAtRaw: any = (v as any)?.createdAt;
        const createdAt = typeof createdAtRaw === 'number' ? createdAtRaw : (createdAtRaw ? new Date(createdAtRaw).getTime() : Date.now());
        out.push({ id: `${prefix}${k}`, ...(v as any), createdAt });
      }
      return out;
    };

    const recompute = (
      a: Record<string, NotificationData> | null,
      b: Record<string, NotificationData> | null,
      c: Record<string, NotificationData> | null
    ) => {
      const merged = [...collect(a, 'a:'), ...collect(b, 'b:'), ...collect(c, 'c:')]
        .sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
      setNotifications(merged);
      setUnreadCount(merged.length);
    };

    let aData: Record<string, NotificationData> | null = null;
    let bData: Record<string, NotificationData> | null = null;
    let cData: Record<string, NotificationData> | null = null;

    const unsubA = onValue(perUserRef, (snap) => {
      aData = snap.val();
      console.log('[notifications] perUserRef', { path: `notifications/${userId}`, value: aData });
      recompute(aData, bData, cData);
    });
    const unsubB = onValue(userNestedRef, (snap) => {
      bData = snap.val();
      console.log('[notifications] userNestedRef', { path: `users/${userId}/notifications`, value: bData });
      recompute(aData, bData, cData);
    });
    const unsubC = onValue(rootByUserQuery, (snap) => {
      cData = snap.val();
      console.log('[notifications] rootByUserQuery', { path: 'notifications (root, by userId)', value: cData });
      recompute(aData, bData, cData);
    });

    return () => {
      off(perUserRef); off(userNestedRef); off(rootByUserQuery);
      unsubA(); unsubB(); unsubC();
    };
  }, [getCurrentUserId]);

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'success': return '🎉';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    // Convert both dates to timestamps (numbers) before subtraction
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getVehicleTypeText = (type: string) => {
    const types: Record<string, string> = {
      'motorcycle': 'Motorcycle',
      'car': 'Car',
      'suv': 'SUV',
      'tricycle': 'Tricycle',
      'double_cab': 'Double Cab',
      'single_cab': 'Single Cab',
      'heavy_truck': 'Heavy Truck',
      'heavy_equipment': 'Heavy Equipment',
      'bicycle': 'Bicycle',
      'e_vehicle': 'E-Vehicle'
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#7E0303] text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#5E0202]">
          <div className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src="/cnsc-logo.png"
                alt="CNSC Logo"
                fill
                className="object-contain"
              />
            </div>
            <h2 className="text-xl font-semibold">CNSC VPS</h2>
          </div>
          {/* Close button - Show on mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-5 px-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 ${
                pathname === item.href
                  ? 'bg-[#5E0202] text-white'
                  : 'text-gray-100 hover:bg-[#5E0202] hover:text-white'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              {/* Hamburger menu - Show on mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-600 mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Toggle sidebar button - Show on desktop only */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex text-gray-500 hover:text-gray-600 mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="text-lg font-semibold text-gray-900">
                CNSC Vehicle Pass System
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative text-gray-500 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Panel */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        <span className="text-sm text-gray-500">{notifications.length} total</span>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 border-b border-gray-100 hover:bg-gray-50"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {notification.message}
                                </p>
                                {notification.data?.vehiclePlate && (
                                  <div className="text-xs text-gray-500 mb-1">
                                    Vehicle: {getVehicleTypeText(notification.data.vehicleType || '')} • {notification.data.vehiclePlate}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">
                                  {formatTimestamp(notification.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-2 border-t border-gray-200">
                      <Link
                        href="/user/notifications"
                        className="block text-center text-sm text-blue-600 hover:text-blue-800 py-2"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  className="text-gray-500 hover:text-gray-600"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <Link href="/user/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                      <button
                        onClick={() => {
                          try { localStorage.removeItem('token'); } catch {}
                          window.location.href = '/signin';
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Logout
                      </button>
                    </div>
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

      {/* Overlay for mobile sidebar and notifications */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {notificationsOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setNotificationsOpen(false)}
        />
      )}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
}