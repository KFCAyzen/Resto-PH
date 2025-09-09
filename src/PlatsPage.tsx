import React from 'react';
import MenuPage from './MenuPage';
import type { MenuItem } from './types';
import { menuItems } from './types';
import { useRealtimeCollection } from './hooks/useRealtimeCollection';

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
  const source = items.length ? items : menuItems;
  const platsOnlyRaw = source.filter(i => !i.catégorie.some(c => drinkCategories.has(c)));
  const platsOnly = Array.from(
    platsOnlyRaw.reduce((acc, item) => {
      const key = item.nom.trim().toLowerCase();
      if (!acc.has(key)) acc.set(key, item);
      return acc;
    }, new Map<string, MenuItem>()).values()
  );
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


