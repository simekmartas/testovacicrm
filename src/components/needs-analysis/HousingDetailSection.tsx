import React from 'react';
import { HousingDetails } from '../../types';

interface Props {
  data?: HousingDetails;
  onUpdate: (data: HousingDetails) => void;
}

function HousingDetailSection({ data, onUpdate }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Detail - Bydlení</h2>
      <p className="text-gray-600">Tato sekce bude brzy implementována...</p>
    </div>
  );
}

export default HousingDetailSection; 