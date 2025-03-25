import React from 'react';
import { Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function ProtectedRoute({ children, isAuthenticated, isAdmin }: ProtectedRouteProps) {
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-gray-600">
        <Lock className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-center">
          You need to be an authenticated administrator to access this area.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}