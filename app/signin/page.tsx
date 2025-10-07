'use client';

import { Suspense } from 'react';
import SignInForm from './SignInForm';

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#554C4C] via-[#7E0303] to-[#7E0303] text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-8 w-64 bg-gray-400 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Form Skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="space-y-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}