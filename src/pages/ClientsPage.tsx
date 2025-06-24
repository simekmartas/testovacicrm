import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clientService } from '../services/localStorageService';
import { Client, WorkflowStage } from '../types';
import toast from 'react-hot-toast';

const workflowStageNames: Record<WorkflowStage, string> = {
  [WorkflowStage.NAVOLANI]: 'Navolání',
  [WorkflowStage.ANALYZA_POTREB]: 'Analýza potřeb',
  [WorkflowStage.ZPRACOVANI]: 'Zpracování',
  [WorkflowStage.PRODEJNI_SCHUZKA]: 'Prodejní schůzka',
  [WorkflowStage.PODPIS]: 'Podpis',
  [WorkflowStage.SERVIS]: 'Servis',
};

const workflowStageColors: Record<WorkflowStage, string> = {
  [WorkflowStage.NAVOLANI]: 'bg-gray-100 text-gray-800',
  [WorkflowStage.ANALYZA_POTREB]: 'bg-blue-100 text-blue-800',
  [WorkflowStage.ZPRACOVANI]: 'bg-yellow-100 text-yellow-800',
  [WorkflowStage.PRODEJNI_SCHUZKA]: 'bg-purple-100 text-purple-800',
  [WorkflowStage.PODPIS]: 'bg-green-100 text-green-800',
  [WorkflowStage.SERVIS]: 'bg-indigo-100 text-indigo-800',
};

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = clientService.search(searchTerm);
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const loadClients = () => {
    try {
      const data = clientService.getAll();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      toast.error('Nepodařilo se načíst klienty');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítání klientů...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Klienti</h1>
          <p className="mt-2 text-sm text-gray-700">
            Seznam všech klientů v systému
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/clients/new"
            className="btn btn-primary inline-flex items-center"
          >
            ➕ Nový klient
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
            placeholder="Hledat klienty..."
          />
        </div>
      </div>

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Jméno
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Telefon
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Poradce
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Fáze
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Akce</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {client.firstName} {client.lastName}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {client.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {client.phone || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {client.advisorName}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${workflowStageColors[client.workflowStage]}`}>
                    {workflowStageNames[client.workflowStage]}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                  <Link
                    to={`/clients/${client.id}`}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Žádní klienti neodpovídají vyhledávání' : 'Zatím nemáte žádné klienty'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientsPage; 