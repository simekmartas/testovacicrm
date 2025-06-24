import React, { useState, useEffect } from 'react';
import { ClientPotential } from '../types';
import { potentialService } from '../services/potentialService';
import { githubPotentialService } from '../services/githubService';
import { hasGithubAccess } from '../config/environment';
import toast from 'react-hot-toast';

interface Props {
  clientId: number;
  onUpdate?: () => void;
}

function PotentialSection({ clientId, onUpdate }: Props) {
  const [potential, setPotential] = useState<ClientPotential | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPotential();
  }, [clientId]);

  const loadPotential = () => {
    let potentialData = potentialService.getByClientId(clientId);
    if (!potentialData) {
      potentialData = potentialService.create(clientId);
    }
    setPotential(potentialData);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!potential) return;

    const updated = potentialService.update(potential.id, potential);
    if (updated) {
      setPotential(updated);
      setIsEditing(false);
      toast.success('Potenciál byl uložen');
      
      // Pokus se synchronizovat s GitHubem
      if (hasGithubAccess()) {
        try {
          await githubPotentialService.save(updated);
          console.log('GitHub save successful for potential:', updated.id);
        } catch (error) {
          console.error('GitHub save failed:', error);
          toast.error('Nepodařilo se uložit na GitHub, změny zůstávají lokálně');
        }
      }
      
      onUpdate?.();
    } else {
      toast.error('Chyba při ukládání');
    }
  };

  const updateField = (category: string, field: string, value: any) => {
    if (!potential) return;

    const updatedPotential = { ...potential };

    if (category === 'nonLifeInsurance') {
      // Speciální handling pro neživotní pojištění
      const [subCategory, subField] = field.split('.');
      const currentSubCategory = (updatedPotential.nonLifeInsurance as any)[subCategory] || {};
      
      (updatedPotential.nonLifeInsurance as any)[subCategory] = {
        ...currentSubCategory,
        [subField]: value
      };
    } else {
      // Ostatní kategorie
      const currentCategory = (updatedPotential as any)[category] || {};
      (updatedPotential as any)[category] = {
        ...currentCategory,
        [field]: value
      };
    }

    // Přepočítej celkovou provizi
    updatedPotential.totalExpectedCommission = 
      updatedPotential.lifeInsurance.expectedCommission +
      updatedPotential.investments.expectedCommission +
      updatedPotential.mortgage.expectedCommission +
      Object.values(updatedPotential.nonLifeInsurance).reduce((sum: number, item: any) => 
        sum + (item.interested ? item.expectedCommission : 0), 0
      );

    // Přepočítej prioritu
    if (updatedPotential.totalExpectedCommission >= 50000) {
      updatedPotential.priority = 'VYSOKY';
    } else if (updatedPotential.totalExpectedCommission >= 20000) {
      updatedPotential.priority = 'STREDNI';
    } else {
      updatedPotential.priority = 'NIZKY';
    }

    setPotential(updatedPotential);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'VYSOKY': return 'bg-red-100 text-red-800';
      case 'STREDNI': return 'bg-yellow-100 text-yellow-800';
      case 'NIZKY': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'VYSOKY': return 'Vysoký';
      case 'STREDNI': return 'Střední';
      case 'NIZKY': return 'Nízký';
      default: return priority;
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Načítání...</div>;
  }

  if (!potential) {
    return <div className="text-center py-4">Chyba při načítání potenciálu</div>;
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">💰 Potenciál klienta</h2>
          <p className="text-sm text-gray-600 mt-1">
            Očekávaná celková provize: <span className="font-semibold">{potential.totalExpectedCommission.toLocaleString('cs-CZ')} Kč</span>
          </p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getPriorityColor(potential.priority)}`}>
            Priorita: {getPriorityLabel(potential.priority)}
          </span>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn btn-secondary"
        >
          {isEditing ? 'Zrušit' : 'Upravit'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          {/* Životní pojištění */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🛡️</span> Životní pojištění
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={potential.lifeInsurance.interested}
                  onChange={(e) => updateField('lifeInsurance', 'interested', e.target.checked)}
                  className="mr-2"
                />
                <span>Má zájem</span>
              </label>
              {potential.lifeInsurance.interested && (
                <>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Očekávaná provize (Kč)</label>
                    <input
                      type="number"
                      value={potential.lifeInsurance.expectedCommission}
                      onChange={(e) => updateField('lifeInsurance', 'expectedCommission', parseInt(e.target.value) || 0)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Poznámky</label>
                    <textarea
                      value={potential.lifeInsurance.notes || ''}
                      onChange={(e) => updateField('lifeInsurance', 'notes', e.target.value)}
                      rows={2}
                      className="input w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Investice */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📈</span> Investice
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={potential.investments.interested}
                  onChange={(e) => updateField('investments', 'interested', e.target.checked)}
                  className="mr-2"
                />
                <span>Má zájem</span>
              </label>
              {potential.investments.interested && (
                <>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Očekávaná provize (Kč)</label>
                    <input
                      type="number"
                      value={potential.investments.expectedCommission}
                      onChange={(e) => updateField('investments', 'expectedCommission', parseInt(e.target.value) || 0)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Poznámky</label>
                    <textarea
                      value={potential.investments.notes || ''}
                      onChange={(e) => updateField('investments', 'notes', e.target.value)}
                      rows={2}
                      className="input w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hypotéka */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🏠</span> Hypotéka
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={potential.mortgage.interested}
                  onChange={(e) => updateField('mortgage', 'interested', e.target.checked)}
                  className="mr-2"
                />
                <span>Má zájem</span>
              </label>
              {potential.mortgage.interested && (
                <>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Očekávaná provize (Kč)</label>
                    <input
                      type="number"
                      value={potential.mortgage.expectedCommission}
                      onChange={(e) => updateField('mortgage', 'expectedCommission', parseInt(e.target.value) || 0)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Poznámky</label>
                    <textarea
                      value={potential.mortgage.notes || ''}
                      onChange={(e) => updateField('mortgage', 'notes', e.target.value)}
                      rows={2}
                      className="input w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Neživotní pojištění */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🚗</span> Neživotní pojištění
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Auto */}
              <div className="border rounded p-3">
                <h4 className="font-medium text-gray-800 mb-2">Auto</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={potential.nonLifeInsurance.auto.interested}
                      onChange={(e) => updateField('nonLifeInsurance', 'auto.interested', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Má zájem</span>
                  </label>
                  {potential.nonLifeInsurance.auto.interested && (
                    <input
                      type="number"
                      value={potential.nonLifeInsurance.auto.expectedCommission}
                      onChange={(e) => updateField('nonLifeInsurance', 'auto.expectedCommission', parseInt(e.target.value) || 0)}
                      placeholder="Provize (Kč)"
                      className="input w-full"
                    />
                  )}
                </div>
              </div>

              {/* Nemovitost */}
              <div className="border rounded p-3">
                <h4 className="font-medium text-gray-800 mb-2">Nemovitost</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={potential.nonLifeInsurance.property.interested}
                      onChange={(e) => updateField('nonLifeInsurance', 'property.interested', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Má zájem</span>
                  </label>
                  {potential.nonLifeInsurance.property.interested && (
                    <input
                      type="number"
                      value={potential.nonLifeInsurance.property.expectedCommission}
                      onChange={(e) => updateField('nonLifeInsurance', 'property.expectedCommission', parseInt(e.target.value) || 0)}
                      placeholder="Provize (Kč)"
                      className="input w-full"
                    />
                  )}
                </div>
              </div>

              {/* Domácnost */}
              <div className="border rounded p-3">
                <h4 className="font-medium text-gray-800 mb-2">Domácnost</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={potential.nonLifeInsurance.household.interested}
                      onChange={(e) => updateField('nonLifeInsurance', 'household.interested', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Má zájem</span>
                  </label>
                  {potential.nonLifeInsurance.household.interested && (
                    <input
                      type="number"
                      value={potential.nonLifeInsurance.household.expectedCommission}
                      onChange={(e) => updateField('nonLifeInsurance', 'household.expectedCommission', parseInt(e.target.value) || 0)}
                      placeholder="Provize (Kč)"
                      className="input w-full"
                    />
                  )}
                </div>
              </div>

              {/* Odpovědnost */}
              <div className="border rounded p-3">
                <h4 className="font-medium text-gray-800 mb-2">Odpovědnost</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={potential.nonLifeInsurance.liability.interested}
                      onChange={(e) => updateField('nonLifeInsurance', 'liability.interested', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Má zájem</span>
                  </label>
                  {potential.nonLifeInsurance.liability.interested && (
                    <input
                      type="number"
                      value={potential.nonLifeInsurance.liability.expectedCommission}
                      onChange={(e) => updateField('nonLifeInsurance', 'liability.expectedCommission', parseInt(e.target.value) || 0)}
                      placeholder="Provize (Kč)"
                      className="input w-full"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
            >
              Zrušit
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              Uložit
            </button>
          </div>
        </div>
      ) : (
        // Zobrazení v read-only režimu
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg ${potential.lifeInsurance.interested ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <div className="font-medium text-sm">🛡️ Životní pojištění</div>
              <div className="text-lg font-semibold">
                {potential.lifeInsurance.interested ? `${potential.lifeInsurance.expectedCommission.toLocaleString('cs-CZ')} Kč` : 'Nemá zájem'}
              </div>
            </div>

            <div className={`p-3 rounded-lg ${potential.investments.interested ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <div className="font-medium text-sm">📈 Investice</div>
              <div className="text-lg font-semibold">
                {potential.investments.interested ? `${potential.investments.expectedCommission.toLocaleString('cs-CZ')} Kč` : 'Nemá zájem'}
              </div>
            </div>

            <div className={`p-3 rounded-lg ${potential.mortgage.interested ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <div className="font-medium text-sm">🏠 Hypotéka</div>
              <div className="text-lg font-semibold">
                {potential.mortgage.interested ? `${potential.mortgage.expectedCommission.toLocaleString('cs-CZ')} Kč` : 'Nemá zájem'}
              </div>
            </div>

            <div className={`p-3 rounded-lg ${Object.values(potential.nonLifeInsurance).some(item => item.interested) ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <div className="font-medium text-sm">🚗 Neživotní poj.</div>
              <div className="text-lg font-semibold">
                {Object.values(potential.nonLifeInsurance).some(item => item.interested) 
                  ? `${Object.values(potential.nonLifeInsurance).reduce((sum, item) => sum + (item.interested ? item.expectedCommission : 0), 0).toLocaleString('cs-CZ')} Kč`
                  : 'Nemá zájem'
                }
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Status synchronizace */}
      <div className="mt-4 text-xs text-gray-500 border-t pt-2">
        {hasGithubAccess() ? (
          <p>✓ Data se ukládají na GitHub</p>
        ) : (
          <p>⚠️ Data se ukládají pouze lokálně</p>
        )}
      </div>
    </div>
  );
}

export default PotentialSection; 