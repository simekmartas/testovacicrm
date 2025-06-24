import React from 'react';
import { InsuranceDetails } from '../../types';

interface Props {
  data?: InsuranceDetails;
  onUpdate: (data: InsuranceDetails) => void;
}

function InsuranceDetailSection({ data, onUpdate }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Detail - Pojištění</h2>
      <p className="text-gray-600">Tato sekce bude brzy implementována...</p>
    </div>
  );
}

export default InsuranceDetailSection; 