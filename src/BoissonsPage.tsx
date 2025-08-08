
import React from 'react';
import MenuPage from './MenuPage';
import type { MenuItem } from './types';
import { drinksItems } from './types';

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  onAddToCart: (item: MenuItem) => void;
};

const BoissonsPage: React.FC<Props> = ({ cartItems, setCartItems, onAddToCart }) => {
  return (
    <MenuPage
      items={drinksItems}
      cartItems={cartItems}
      setCartItems={setCartItems}
      onAddToCart={onAddToCart}
    />
  );
};

export default BoissonsPage;
