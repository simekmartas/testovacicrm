import React from 'react';
import { InvestmentDetails } from '../../types';

interface Props {
  data?: InvestmentDetails;
  onUpdate: (data: InvestmentDetails) => void;
}

function InvestmentDetailSection({ data, onUpdate }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Detail - Investice a penze</h2>
      <p className="text-gray-600">Tato sekce bude brzy implementována...</p>
    </div>
  );
}

export default InvestmentDetailSection; 