import React, { useState } from 'react';
import { CashFlow } from '../../types';

interface Props {
  data: CashFlow;
  onUpdate: (data: CashFlow) => void;
}

function CashFlowSection({ data, onUpdate }: Props) {
  const [formData, setFormData] = useState<CashFlow>(data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (field: keyof CashFlow, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateNetIncome = () => {
    const totalIncome = formData.officialIncome + formData.additionalIncome;
    const totalExpenses = formData.expenses + formData.loans + formData.overdraft;
    return totalIncome - totalExpenses;
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Cash Flow - Finanční přehled</h2>

      {/* Příjmy */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">💰</span> Příjmy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Oficiální příjem (čistý)</label>
            <input
              type="number"
              value={formData.officialIncome || ''}
              onChange={(e) => handleChange('officialIncome', parseInt(e.target.value) || 0)}
              className="input"
              placeholder="Čistá mzda nebo příjem z podnikání"
            />
          </div>
          <div>
            <label className="label">Dodatečné příjmy</label>
            <input
              type="number"
              value={formData.additionalIncome || ''}
              onChange={(e) => handleChange('additionalIncome', parseInt(e.target.value) || 0)}
              className="input"
              placeholder="Pronájem, brigády, investice..."
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="label">Typ zaměstnání</label>
          <select
            value={formData.employmentType}
            onChange={(e) => handleChange('employmentType', e.target.value)}
            className="input"
          >
            <option value="NEURCITA">Pracovní poměr na dobu neurčitou</option>
            <option value="URCITA">Pracovní poměr na dobu určitou</option>
            <option value="OSVC">OSVČ / Podnikání</option>
          </select>
        </div>

        {formData.employmentType !== 'OSVC' && (
          <div className="mt-4">
            <label className="label">Příspěvek zaměstnavatele (penzijko, stravenky...)</label>
            <input
              type="number"
              value={formData.employerContribution || ''}
              onChange={(e) => handleChange('employerContribution', parseInt(e.target.value) || 0)}
              className="input"
              placeholder="Měsíční hodnota benefitů"
            />
          </div>
        )}
      </div>

      {/* Výdaje */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">💸</span> Výdaje
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Běžné měsíční výdaje</label>
            <input
              type="number"
              value={formData.expenses || ''}
              onChange={(e) => handleChange('expenses', parseInt(e.target.value) || 0)}
              className="input"
              placeholder="Nájem, jídlo, doprava..."
            />
          </div>
          <div>
            <label className="label">Splátky úvěrů</label>
            <input
              type="number"
              value={formData.loans || ''}
              onChange={(e) => handleChange('loans', parseInt(e.target.value) || 0)}
              className="input"
              placeholder="Hypotéka, spotřebitelské úvěry..."
            />
          </div>
          <div>
            <label className="label">Kontokorent</label>
            <input
              type="number"
              value={formData.overdraft || ''}
              onChange={(e) => handleChange('overdraft', parseInt(e.target.value) || 0)}
              className="input"
              placeholder="Čerpání kontokorentu"
            />
          </div>
        </div>
      </div>

      {/* Souhrn */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Souhrn</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Celkové příjmy:</span>
            <span className="font-semibold text-green-600">
              {(formData.officialIncome + formData.additionalIncome).toLocaleString('cs-CZ')} Kč
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Celkové výdaje:</span>
            <span className="font-semibold text-red-600">
              {(formData.expenses + formData.loans + formData.overdraft).toLocaleString('cs-CZ')} Kč
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-800 font-medium">Měsíční přebytek/schodek:</span>
              <span className={`font-bold text-lg ${calculateNetIncome() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calculateNetIncome().toLocaleString('cs-CZ')} Kč
              </span>
            </div>
          </div>
        </div>
        
        {calculateNetIncome() < 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-sm text-red-800">
              ⚠️ Vaše výdaje převyšují příjmy. Doporučujeme optimalizovat rozpočet.
            </p>
          </div>
        )}
        
        {calculateNetIncome() > 0 && calculateNetIncome() < 5000 && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
            <p className="text-sm text-yellow-800">
              💡 Máte malou finanční rezervu. Doporučujeme vytvořit fond pro neočekávané výdaje.
            </p>
          </div>
        )}
        
        {calculateNetIncome() >= 5000 && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
            <p className="text-sm text-green-800">
              ✅ Máte dobrý finanční přebytek. Zvažte jeho efektivní zhodnocení.
            </p>
          </div>
        )}
      </div>

      {/* Poznámky pro poradce */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tipy pro analýzu:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Ověřte prokazatelnost příjmů (výplatní pásky, daňové přiznání)</li>
          <li>Zkontrolujte registry dlužníků</li>
          <li>Proberte možnosti optimalizace výdajů</li>
          <li>Zjistěte cíle pro volné prostředky</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary">
          Uložit sekci
        </button>
      </div>
    </form>
  );
}

export default CashFlowSection; 