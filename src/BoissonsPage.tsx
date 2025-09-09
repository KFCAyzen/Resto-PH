import React from 'react';
import MenuPage from './MenuPage';
import type { MenuItem } from './types';
import { drinksItems } from './types';
import { useRealtimeCollection } from './hooks/useRealtimeCollection';

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  onAddToCart: (item: MenuItem) => void;
  category?: string;
  searchTerm?: string;
};

const BoissonsPage: React.FC<Props> = ({
  cartItems,
  setCartItems,
  onAddToCart,
  category,
  searchTerm = '',
}) => {
  const { items } = useRealtimeCollection('Boissons');
  // Deduplicate by name to avoid duplicates across seed or manual entries
  const source = items.length ? items : drinksItems;
  const deduped = Array.from(
    source.reduce((acc, item) => {
      const key = item.nom.trim().toLowerCase();
      if (!acc.has(key)) acc.set(key, item);
      return acc;
    }, new Map<string, MenuItem>()).values()
  );
  return (
    <MenuPage
      items={deduped}
      cartItems={cartItems}
      setCartItems={setCartItems}
      onAddToCart={onAddToCart}
      category={category}
      searchTerm={searchTerm}
    />
  );
};

export default BoissonsPage;
