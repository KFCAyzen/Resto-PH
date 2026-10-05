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

const BoissonsPage: React.FC<Props> = ({ onAddToCart, searchTerm = '', onClearSearch }) => {
  const { items, loading, error } = useRealtimeCollection('Boissons');

  return (
    <MenuPage
      items={dedupeParNom(items)}
      loading={loading}
      error={error}
      onAddToCart={onAddToCart}
      searchTerm={searchTerm}
      onClearSearch={onClearSearch}
    />
  );
};

export default BoissonsPage;
