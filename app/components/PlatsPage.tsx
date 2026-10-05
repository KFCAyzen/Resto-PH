import React from 'react';
import MenuPage from './MenuPage';
import type { MenuItem } from '../types';
import { useRealtimeCollection } from '../hooks/useRealtimeCollection';
import { dedupeParNom } from '../lib/menu';

type Props = {
  onAddToCart: (item: MenuItem) => void;
  searchTerm?: string;
  onClearSearch?: () => void;
};

// Catégories de boissons parfois enregistrées par erreur dans la collection "Plats"
const DRINK_CATEGORIES = new Set<string>([
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

const PlatsPage: React.FC<Props> = ({ onAddToCart, searchTerm = '', onClearSearch }) => {
  const { items, loading, error } = useRealtimeCollection('Plats');
  const platsOnly = dedupeParNom(items.filter(i => !i.catégorie.some(c => DRINK_CATEGORIES.has(c))));

  return (
    <MenuPage
      items={platsOnly}
      loading={loading}
      error={error}
      onAddToCart={onAddToCart}
      searchTerm={searchTerm}
      onClearSearch={onClearSearch}
    />
  );
};

export default PlatsPage;
