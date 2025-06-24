import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-700">
        Vítejte zpět, {user?.firstName} {user?.lastName}!
      </p>
      
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900">Urgentní úkoly</h3>
          <p className="mt-2 text-sm text-gray-500">
            Zde se zobrazí úkoly, které vyžadují vaši pozornost.
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900">Dnešní schůzky</h3>
          <p className="mt-2 text-sm text-gray-500">
            Přehled vašich dnešních schůzek.
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900">Statistiky</h3>
          <p className="mt-2 text-sm text-gray-500">
            Přehled vašich výsledků a statistik.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage; 