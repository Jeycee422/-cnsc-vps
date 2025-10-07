'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#554C4C] via-[#7E0303] to-[#7E0303] text-white shadow-md" style={{ backgroundSize: '200% 100%', backgroundPosition: 'left' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
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
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/signin"
              className="px-4 py-2 rounded-md bg-[#FFA500] text-[#7E0303] font-semibold hover:bg-[#FF8C00] transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/signup"
              className="px-4 py-2 rounded-md border-2 border-[#FFA500] text-[#FFA500] font-semibold hover:bg-[#FFA500] hover:text-[#7E0303] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16 mt-16">
          <h2 className="text-4xl font-bold text-[#7E0303] mb-6">
            Welcome to CNSC Vehicle Pass System
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your campus vehicle access with our secure and efficient pass management system
          </p>
          <Link 
            href="/signup"
            className="px-8 py-3 rounded-md bg-[#7E0303] text-white font-semibold hover:bg-[#5E0202] transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-[#FFA500] text-4xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-[#7E0303] mb-2">Easy Pass Management</h3>
            <p className="text-gray-600">Quick and hassle-free process for obtaining and managing your vehicle pass</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-[#FFA500] text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-[#7E0303] mb-2">Secure Access</h3>
            <p className="text-gray-600">Enhanced security measures to ensure only authorized vehicles enter the campus</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-[#FFA500] text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-[#7E0303] mb-2">Digital Convenience</h3>
            <p className="text-gray-600">Manage your pass digitally with our user-friendly mobile interface</p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[#7E0303] text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#7E0303] text-white rounded-full flex items-center justify-center mx-auto mb-4">1</div>
              <h4 className="font-semibold mb-2">Register</h4>
              <p className="text-gray-600">Create your account</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#7E0303] text-white rounded-full flex items-center justify-center mx-auto mb-4">2</div>
              <h4 className="font-semibold mb-2">Apply</h4>
              <p className="text-gray-600">Submit your vehicle details</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#7E0303] text-white rounded-full flex items-center justify-center mx-auto mb-4">3</div>
              <h4 className="font-semibold mb-2">Verify</h4>
              <p className="text-gray-600">Wait for approval</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#7E0303] text-white rounded-full flex items-center justify-center mx-auto mb-4">4</div>
              <h4 className="font-semibold mb-2">Access</h4>
              <p className="text-gray-600">Get your digital pass</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#7E0303] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">CNSC VPS</h3>
              <p className="text-gray-300">Streamlining campus vehicle access for a better tomorrow.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-300 hover:text-[#FFA500]">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-[#FFA500]">Contact</Link></li>
                <li><Link href="/faq" className="text-gray-300 hover:text-[#FFA500]">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Email: support@cnsc.edu</li>
                <li>Phone: (123) 456-7890</li>
                <li>Address: CNSC Campus</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-300 hover:text-[#FFA500]">Facebook</Link>
                <Link href="#" className="text-gray-300 hover:text-[#FFA500]">Twitter</Link>
                <Link href="#" className="text-gray-300 hover:text-[#FFA500]">Instagram</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; {new Date().getFullYear()} CNSC Vehicle Pass System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
