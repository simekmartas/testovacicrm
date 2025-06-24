import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Client } from '../types';
import { clientService } from '../services/localStorageService';
import { needsAnalysisService } from '../services/needsAnalysisService';

function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<{ exists: boolean; percentage: number }>({ exists: false, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadClientData(parseInt(id));
    }
  }, [id]);

  const loadClientData = (clientId: number) => {
    const clientData = clientService.getById(clientId);
    if (clientData) {
      setClient(clientData);
      
      // Zkontroluj stav analýzy potřeb
      const analysis = needsAnalysisService.getByClientId(clientId);
      if (analysis) {
        const percentage = needsAnalysisService.getCompletionPercentage(analysis);
        setAnalysisStatus({ exists: true, percentage });
      }
    }
    setIsLoading(false);
  };

  const handleDelete = () => {
    if (window.confirm('Opravdu chcete smazat tohoto klienta? Tato akce je nevratná.')) {
      if (id) {
        clientService.delete(parseInt(id));
        navigate('/clients');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítání...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Klient nenalezen</p>
        <Link to="/clients" className="text-primary-600 hover:text-primary-800 mt-4 inline-block">
          Zpět na seznam klientů
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Link to="/clients" className="text-sm text-gray-600 hover:text-gray-900">
            ← Zpět na seznam klientů
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {client.firstName} {client.lastName}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/clients/${id}/edit`}
            className="btn btn-secondary"
          >
            Upravit
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
          >
            Smazat
          </button>
        </div>
      </div>

      {/* Analýza potřeb */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              📋 Analýza potřeb
            </h2>
            {analysisStatus.exists ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Dokončeno:</span>
                  <span className="ml-2 font-semibold">{analysisStatus.percentage}%</span>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysisStatus.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Analýza potřeb ještě nebyla zahájena</p>
            )}
          </div>
          <Link
            to={`/clients/${id}/needs-analysis`}
            className="btn btn-primary"
          >
            {analysisStatus.exists ? 'Pokračovat v analýze' : 'Zahájit analýzu'}
          </Link>
        </div>
      </div>

      {/* Základní informace */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Základní informace</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Telefon</dt>
            <dd className="mt-1 text-sm text-gray-900">{client.phone || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Datum narození</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('cs-CZ') : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Poradce</dt>
            <dd className="mt-1 text-sm text-gray-900">{client.advisorName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Fáze spolupráce</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {client.workflowStage}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Datum vytvoření</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(client.createdAt).toLocaleDateString('cs-CZ')}
            </dd>
          </div>
        </dl>
      </div>

      {/* Adresa */}
      {(client.address || client.city || client.postalCode) && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adresa</h2>
          <address className="not-italic text-sm text-gray-900">
            {client.address && <div>{client.address}</div>}
            {(client.city || client.postalCode) && (
              <div>
                {client.postalCode && `${client.postalCode} `}
                {client.city}
              </div>
            )}
          </address>
        </div>
      )}

      {/* Poznámky */}
      {client.notes && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Poznámky</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* Rychlé akce */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rychlé akce</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-secondary">
            📅 Naplánovat schůzku
          </button>
          <button className="btn btn-secondary">
            ✅ Vytvořit úkol
          </button>
          <button className="btn btn-secondary">
            📄 Nahrát dokument
          </button>
          <button className="btn btn-secondary">
            📧 Poslat email
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientDetailPage; 