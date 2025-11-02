import React from 'react';
import MenuPage from './MenuPage';
import type { MenuItem } from '../types';
import { menuItems } from '../types';
import { useRealtimeCollection } from '../hooks/useRealtimeCollection';

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  onAddToCart: (item: MenuItem) => void;
  category?: string;
  searchTerm?: string;
};

const PlatsPage: React.FC<Props> = ({
  cartItems,
  setCartItems,
  onAddToCart,
  category,
  searchTerm = '',
}) => {
  const { items } = useRealtimeCollection('Plats');
  const drinkCategories = new Set<string>([
    'Vins',
    'Vins Blanc',
    'Vins Rouge',
    'Vins Rosé',
    'Whiskys',
    'Boissons Gazeuse',
    'Bières / Brasséries',
    'Champagnes',
    'Vodka',
    'Boissons Energétique',
    'Jus Naturels',
    'Boissons chaudes',
  ]);
  // Force using Firestore data only, no fallback to local data
  const source = items;
  const platsOnlyRaw = source.filter(i => 
    !i.catégorie.some(c => drinkCategories.has(c)) && 
    !i.masque // Exclure les items masqués
  );
  const platsOnly = Array.from(
    platsOnlyRaw.reduce((acc, item) => {
      const key = item.nom.trim().toLowerCase();
      if (!acc.has(key)) acc.set(key, item);
      return acc;
    }, new Map<string, MenuItem>()).values()
  );
  // Only render if we have Firestore data
  if (items.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #7d3837',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#7d3837', fontSize: '1rem', margin: 0 }}>Chargement des plats...</p>
      </div>
    );
  }

  return (
    <MenuPage
      items={platsOnly}
      cartItems={cartItems}
      setCartItems={setCartItems}
      onAddToCart={onAddToCart}
      category={category}
      searchTerm={searchTerm}
    />
  );
};

export default PlatsPage;


