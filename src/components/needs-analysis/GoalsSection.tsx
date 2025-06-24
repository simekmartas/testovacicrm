import React, { useState } from 'react';
import { NeedsAnalysisGoals } from '../../types';

interface Props {
  data: NeedsAnalysisGoals;
  onUpdate: (data: NeedsAnalysisGoals) => void;
}

function GoalsSection({ data, onUpdate }: Props) {
  const [formData, setFormData] = useState<NeedsAnalysisGoals>(data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const updateField = (category: keyof NeedsAnalysisGoals, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [field]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Cíle klienta</h2>

      {/* Zajištění příjmů */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">💰</span> Zajištění příjmů
        </h3>
        <div className="space-y-4 ml-8">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.incomeProtection.interested}
                onChange={(e) => updateField('incomeProtection', 'interested', e.target.checked)}
                className="mr-2"
              />
              <span>Zajímá mě ochrana příjmů při nemoci nebo úrazu</span>
            </label>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Poznámky:</label>
            <textarea
              value={formData.incomeProtection.notes}
              onChange={(e) => updateField('incomeProtection', 'notes', e.target.value)}
              rows={2}
              className="input w-full"
              placeholder="Obavy ze ztráty příjmu, současná situace..."
            />
          </div>
        </div>
      </div>

      {/* Bydlení */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🏠</span> Bydlení
        </h3>
        <div className="space-y-4 ml-8">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.housing.interested}
                onChange={(e) => updateField('housing', 'interested', e.target.checked)}
                className="mr-2"
              />
              <span>Chci řešit vlastní bydlení</span>
            </label>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Proč ano / Proč ne:</label>
            <textarea
              value={formData.housing.reason}
              onChange={(e) => updateField('housing', 'reason', e.target.value)}
              rows={2}
              className="input w-full"
              placeholder="Důvody pro vlastní bydlení nebo současná spokojenost..."
            />
          </div>
        </div>
      </div>

      {/* Penze */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">👴</span> Penze
        </h3>
        <div className="space-y-4 ml-8">
          <p className="text-sm text-gray-600 italic">
            "Představ si, že se zítra vzbudíš a tvůj příjem bude na 1/3, jak by ses cítil/a?"
          </p>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.pension.interested}
                onChange={(e) => updateField('pension', 'interested', e.target.checked)}
                className="mr-2"
              />
              <span>Zajímá mě zajištění důstojného důchodu</span>
            </label>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Současná situace:</label>
            <textarea
              value={formData.pension.currentSituation}
              onChange={(e) => updateField('pension', 'currentSituation', e.target.value)}
              rows={2}
              className="input w-full"
              placeholder="Co už mám zajištěno, obavy z budoucnosti..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Představa řešení:</label>
            <textarea
              value={formData.pension.desiredSolution}
              onChange={(e) => updateField('pension', 'desiredSolution', e.target.value)}
              rows={2}
              className="input w-full"
              placeholder="Kolik bych chtěl mít v důchodu, kdy odejít..."
            />
          </div>
        </div>
      </div>

      {/* Děti */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">👶</span> Děti
        </h3>
        <div className="space-y-4 ml-8">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.children.hasChildren}
                onChange={(e) => updateField('children', 'hasChildren', e.target.checked)}
                className="mr-2"
              />
              <span>Mám děti</span>
            </label>
          </div>
          {formData.children.hasChildren && (
            <>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.children.savingForEducation}
                    onChange={(e) => updateField('children', 'savingForEducation', e.target.checked)}
                    className="mr-2"
                  />
                  <span>Chci jim spořit na vzdělání / budoucnost</span>
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Cílová částka:</label>
                <input
                  type="number"
                  value={formData.children.amount || ''}
                  onChange={(e) => updateField('children', 'amount', parseInt(e.target.value) || 0)}
                  className="input w-full"
                  placeholder="Kolik chci našetřit..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Poznámky:</label>
                <textarea
                  value={formData.children.notes}
                  onChange={(e) => updateField('children', 'notes', e.target.value)}
                  rows={2}
                  className="input w-full"
                  placeholder="Soukromá škola, vysoká škola, start do života..."
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ukládání financí */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">💸</span> Ukládání financí a tvorba rezerv
        </h3>
        <div className="space-y-4 ml-8">
          <p className="text-sm text-gray-600 italic">
            "Máš stejně peněz, ale všechno okolo je dražší. Banky nabízí 1-2% p.a., inflace atakovala 17%."
          </p>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.savings.interested}
                onChange={(e) => updateField('savings', 'interested', e.target.checked)}
                className="mr-2"
              />
              <span>Chci efektivněji zhodnocovat své úspory</span>
            </label>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Současné úspory:</label>
            <input
              type="number"
              value={formData.savings.currentSavings || ''}
              onChange={(e) => updateField('savings', 'currentSavings', parseInt(e.target.value) || 0)}
              className="input w-full"
              placeholder="Kolik mám našetřeno..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Důvod spoření:</label>
            <textarea
              value={formData.savings.reason}
              onChange={(e) => updateField('savings', 'reason', e.target.value)}
              rows={2}
              className="input w-full"
              placeholder="Na co spořím, jaké mám cíle..."
            />
          </div>
        </div>
      </div>

      {/* Ochrana majetku */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🛡️</span> Ochrana majetku
        </h3>
        <div className="space-y-4 ml-8">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.assetProtection.interested}
                onChange={(e) => updateField('assetProtection', 'interested', e.target.checked)}
                className="mr-2"
              />
              <span>Chci ochránit svůj majetek</span>
            </label>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Jaký majetek vlastním:</label>
            <div className="space-y-2">
              {['Byt/Dům', 'Auto', 'Cennosti', 'Elektronika', 'Jiné'].map(asset => (
                <label key={asset} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assetProtection.assets.includes(asset)}
                    onChange={(e) => {
                      const newAssets = e.target.checked
                        ? [...formData.assetProtection.assets, asset]
                        : formData.assetProtection.assets.filter(a => a !== asset);
                      updateField('assetProtection', 'assets', newAssets);
                    }}
                    className="mr-2"
                  />
                  <span>{asset}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Proč ano / Proč ne:</label>
            <textarea
              value={formData.assetProtection.reason}
              onChange={(e) => updateField('assetProtection', 'reason', e.target.value)}
              rows={2}
              className="input w-full"
              placeholder="Důvody pro pojištění majetku..."
            />
          </div>
        </div>
      </div>

      {/* Jiné */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">💡</span> Ostatní
        </h3>
        <div className="space-y-4 ml-8">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.other.taxOptimization}
                onChange={(e) => updateField('other', 'taxOptimization', e.target.checked)}
                className="mr-2"
              />
              <span>Mám zájem o daňovou optimalizaci</span>
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.other.stateSupport}
                onChange={(e) => updateField('other', 'stateSupport', e.target.checked)}
                className="mr-2"
              />
              <span>Zajímá mě získání státní podpory</span>
            </label>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Kdybys měl/a neomezené množství peněz a času, co bys dělal/a?
            </label>
            <textarea
              value={formData.other.lifeGoals}
              onChange={(e) => updateField('other', 'lifeGoals', e.target.value)}
              rows={3}
              className="input w-full"
              placeholder="Životní sny a cíle..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary">
          Uložit sekci
        </button>
      </div>
    </form>
  );
}

export default GoalsSection; 