import React, { useState } from 'react';
import { ExistingProduct } from '../../types';

interface Props {
  data: ExistingProduct[];
  onUpdate: (data: ExistingProduct[]) => void;
}

function ExistingProductsSection({ data, onUpdate }: Props) {
  const [products, setProducts] = useState<ExistingProduct[]>(data);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<ExistingProduct>({
    id: '',
    type: '',
    company: '',
    reason: '',
    usage: '',
    pros: '',
    cons: '',
    advisor: '',
    hasContract: false
  });

  const productTypes = [
    'Stavební spoření',
    'Penzijní připojištění',
    'Životní pojištění',
    'Úrazové pojištění',
    'Pojištění nemovitosti',
    'Pojištění domácnosti',
    'Povinné ručení',
    'Havarijní pojištění',
    'Investiční fond',
    'Spořicí účet',
    'Termínovaný vklad',
    'Hypotéka',
    'Spotřebitelský úvěr',
    'Jiné'
  ];

  const handleAddProduct = () => {
    if (newProduct.type && newProduct.company) {
      const productToAdd = {
        ...newProduct,
        id: Date.now().toString()
      };
      const updatedProducts = [...products, productToAdd];
      setProducts(updatedProducts);
      onUpdate(updatedProducts);
      
      // Reset form
      setNewProduct({
        id: '',
        type: '',
        company: '',
        reason: '',
        usage: '',
        pros: '',
        cons: '',
        advisor: '',
        hasContract: false
      });
    }
  };

  const handleDeleteProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    onUpdate(updatedProducts);
  };

  const handleEditProduct = (product: ExistingProduct) => {
    setEditingId(product.id);
    setNewProduct(product);
  };

  const handleUpdateProduct = () => {
    const updatedProducts = products.map(p => 
      p.id === editingId ? { ...newProduct, id: editingId } : p
    );
    setProducts(updatedProducts);
    onUpdate(updatedProducts);
    
    // Reset form
    setEditingId(null);
    setNewProduct({
      id: '',
      type: '',
      company: '',
      reason: '',
      usage: '',
      pros: '',
      cons: '',
      advisor: '',
      hasContract: false
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Stávající portfolio</h2>

      {/* Seznam produktů */}
      {products.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Současné produkty</h3>
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="card p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.type}</h4>
                    <p className="text-sm text-gray-600 mt-1">Společnost: {product.company}</p>
                    
                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Důvod uzavření:</span> {product.reason}
                      </div>
                      <div>
                        <span className="font-medium">Využití:</span> {product.usage}
                      </div>
                      <div>
                        <span className="font-medium">Výhody:</span> {product.pros}
                      </div>
                      <div>
                        <span className="font-medium">Nevýhody:</span> {product.cons}
                      </div>
                      <div>
                        <span className="font-medium">Poradce:</span> {product.advisor}
                      </div>
                      <div>
                        <span className="font-medium">Smlouva k dispozici:</span>{' '}
                        {product.hasContract ? 'Ano' : 'Ne'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulář pro přidání/editaci */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {editingId ? 'Upravit produkt' : 'Přidat produkt'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Typ produktu *</label>
            <select
              value={newProduct.type}
              onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
              className="input"
            >
              <option value="">Vyberte typ...</option>
              {productTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Společnost *</label>
            <input
              type="text"
              value={newProduct.company}
              onChange={(e) => setNewProduct({ ...newProduct, company: e.target.value })}
              className="input"
              placeholder="Název pojišťovny/banky..."
            />
          </div>
          
          <div>
            <label className="label">Proč jste to uzavřel/a?</label>
            <input
              type="text"
              value={newProduct.reason}
              onChange={(e) => setNewProduct({ ...newProduct, reason: e.target.value })}
              className="input"
              placeholder="Hypotéka, ochrana rodiny..."
            />
          </div>
          
          <div>
            <label className="label">Jak to využíváte?</label>
            <input
              type="text"
              value={newProduct.usage}
              onChange={(e) => setNewProduct({ ...newProduct, usage: e.target.value })}
              className="input"
              placeholder="Pravidelně spořím, jen platím..."
            />
          </div>
          
          <div>
            <label className="label">Co se vám líbí?</label>
            <input
              type="text"
              value={newProduct.pros}
              onChange={(e) => setNewProduct({ ...newProduct, pros: e.target.value })}
              className="input"
              placeholder="Nízké poplatky, dobrý výnos..."
            />
          </div>
          
          <div>
            <label className="label">Co se vám nelíbí?</label>
            <input
              type="text"
              value={newProduct.cons}
              onChange={(e) => setNewProduct({ ...newProduct, cons: e.target.value })}
              className="input"
              placeholder="Vysoké poplatky, malý výnos..."
            />
          </div>
          
          <div>
            <label className="label">S kým jste to uzavíral/a?</label>
            <input
              type="text"
              value={newProduct.advisor}
              onChange={(e) => setNewProduct({ ...newProduct, advisor: e.target.value })}
              className="input"
              placeholder="Jméno poradce/banky..."
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={newProduct.hasContract}
                onChange={(e) => setNewProduct({ ...newProduct, hasContract: e.target.checked })}
                className="mr-2"
              />
              <span>Mám smlouvu k dispozici</span>
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex gap-2">
          {editingId ? (
            <>
              <button
                onClick={handleUpdateProduct}
                className="btn btn-primary"
              >
                Uložit změny
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setNewProduct({
                    id: '',
                    type: '',
                    company: '',
                    reason: '',
                    usage: '',
                    pros: '',
                    cons: '',
                    advisor: '',
                    hasContract: false
                  });
                }}
                className="btn btn-secondary"
              >
                Zrušit
              </button>
            </>
          ) : (
            <button
              onClick={handleAddProduct}
              disabled={!newProduct.type || !newProduct.company}
              className="btn btn-primary disabled:opacity-50"
            >
              Přidat produkt
            </button>
          )}
        </div>
      </div>

      {/* Poznámky pro poradce */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Důležité otázky:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Proč to uzavřel? (motivace klienta)</li>
          <li>Proč tato společnost? (důvěra, reference)</li>
          <li>Jak to využívá? (aktivně spoří nebo jen platí)</li>
          <li>Co se mu líbí/nelíbí? (spokojenost)</li>
          <li>S kým to uzavíral? (konkurence)</li>
          <li>Má smlouvu u sebe? (možnost analýzy)</li>
        </ul>
      </div>
    </div>
  );
}

export default ExistingProductsSection; 