import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client, NeedsAnalysis } from '../types';
import { clientService } from '../services/localStorageService';
import { needsAnalysisService } from '../services/needsAnalysisService';
import GoalsSection from '../components/needs-analysis/GoalsSection';
import ExistingProductsSection from '../components/needs-analysis/ExistingProductsSection';
import CashFlowSection from '../components/needs-analysis/CashFlowSection';
import InsuranceDetailSection from '../components/needs-analysis/InsuranceDetailSection';
import HousingDetailSection from '../components/needs-analysis/HousingDetailSection';
import InvestmentDetailSection from '../components/needs-analysis/InvestmentDetailSection';
import toast from 'react-hot-toast';

const sections = [
  { id: 'goals', name: 'Cíle', icon: '🎯' },
  { id: 'existingProducts', name: 'Stávající portfolio', icon: '📋' },
  { id: 'cashFlow', name: 'Cash flow', icon: '💰' },
  { id: 'insuranceDetails', name: 'Detail - Pojištění', icon: '🛡️' },
  { id: 'housingDetails', name: 'Detail - Bydlení', icon: '🏠' },
  { id: 'investmentDetails', name: 'Detail - Investice', icon: '📈' },
];

function NeedsAnalysisPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [analysis, setAnalysis] = useState<NeedsAnalysis | null>(null);
  const [activeSection, setActiveSection] = useState('goals');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      navigate('/clients');
      return;
    }

    loadData(parseInt(clientId));
  }, [clientId, navigate]);

  const loadData = (id: number) => {
    const clientData = clientService.getById(id);
    if (!clientData) {
      toast.error('Klient nenalezen');
      navigate('/clients');
      return;
    }

    setClient(clientData);
    
    // Načti nebo vytvoř analýzu
    let analysisData = needsAnalysisService.getByClientId(id);
    if (!analysisData) {
      analysisData = needsAnalysisService.create(id);
    }
    
    setAnalysis(analysisData);
    setIsLoading(false);
  };

  const handleSectionUpdate = (sectionId: string, data: any) => {
    if (!analysis) return;

    const updated = needsAnalysisService.updateSection(analysis.id, sectionId, data);
    if (updated) {
      setAnalysis(updated);
      toast.success('Sekce uložena');
    }
  };

  const getCompletionPercentage = () => {
    if (!analysis) return 0;
    return needsAnalysisService.getCompletionPercentage(analysis);
  };

  const isSectionCompleted = (sectionId: string) => {
    return analysis?.completedSections.includes(sectionId) || false;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítání analýzy...</div>
      </div>
    );
  }

  if (!client || !analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Data nenalezena</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/clients/${clientId}`)}
          className="text-sm text-gray-600 hover:text-gray-900 mb-2"
        >
          ← Zpět na detail klienta
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Analýza potřeb - {client.firstName} {client.lastName}
        </h1>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Celkový pokrok</span>
            <span className="text-sm font-medium">{getCompletionPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="card p-4">
            <h3 className="font-medium text-gray-900 mb-4">Sekce analýzy</h3>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">{section.icon}</span>
                      <span>{section.name}</span>
                    </div>
                    {isSectionCompleted(section.id) && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="card p-4 mt-4">
            <h3 className="font-medium text-gray-900 mb-3">Souhrn</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500">Vytvořeno</dt>
                <dd className="text-sm font-medium">
                  {new Date(analysis.createdAt).toLocaleDateString('cs-CZ')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Poslední úprava</dt>
                <dd className="text-sm font-medium">
                  {new Date(analysis.updatedAt).toLocaleDateString('cs-CZ')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Stav</dt>
                <dd className="text-sm font-medium">
                  {analysis.isComplete ? (
                    <span className="text-green-600">Dokončeno</span>
                  ) : (
                    <span className="text-yellow-600">Rozpracováno</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="card p-6">
            {activeSection === 'goals' && (
              <GoalsSection
                data={analysis.goals}
                onUpdate={(data) => handleSectionUpdate('goals', data)}
              />
            )}
            {activeSection === 'existingProducts' && (
              <ExistingProductsSection
                data={analysis.existingProducts}
                onUpdate={(data) => handleSectionUpdate('existingProducts', data)}
              />
            )}
            {activeSection === 'cashFlow' && (
              <CashFlowSection
                data={analysis.cashFlow}
                onUpdate={(data) => handleSectionUpdate('cashFlow', data)}
              />
            )}
            {activeSection === 'insuranceDetails' && (
              <InsuranceDetailSection
                data={analysis.insuranceDetails}
                onUpdate={(data) => handleSectionUpdate('insuranceDetails', data)}
              />
            )}
            {activeSection === 'housingDetails' && (
              <HousingDetailSection
                data={analysis.housingDetails}
                onUpdate={(data) => handleSectionUpdate('housingDetails', data)}
              />
            )}
            {activeSection === 'investmentDetails' && (
              <InvestmentDetailSection
                data={analysis.investmentDetails}
                onUpdate={(data) => handleSectionUpdate('investmentDetails', data)}
              />
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => {
                const currentIndex = sections.findIndex(s => s.id === activeSection);
                if (currentIndex > 0) {
                  setActiveSection(sections[currentIndex - 1].id);
                }
              }}
              disabled={activeSection === sections[0].id}
              className="btn btn-secondary disabled:opacity-50"
            >
              ← Předchozí
            </button>
            <button
              onClick={() => {
                const currentIndex = sections.findIndex(s => s.id === activeSection);
                if (currentIndex < sections.length - 1) {
                  setActiveSection(sections[currentIndex + 1].id);
                }
              }}
              disabled={activeSection === sections[sections.length - 1].id}
              className="btn btn-primary disabled:opacity-50"
            >
              Další →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NeedsAnalysisPage; 