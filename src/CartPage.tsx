import React from 'react';
import { MenuItem } from './types';
import logo from "./assets/WhatsApp Image 2025-07-29 à 14.49.18_44930011.jpg"
import { images } from './images';

type Props = {
  cartItems: MenuItem[];
};

const CartPage: React.FC<Props> = ({ cartItems }) => {
  return (
    <>
    <div className='cart' style={{ padding: '2rem' }}>
      <h1>Votre Panier </h1>
      {cartItems.length === 0 ? (
        <p>Le panier est vide.</p>
      ) : (
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              {item.nom} - {item.prix}
            </li>
          ))}
        </ul>
      )}
    </div>
    </>
  );
};

export default CartPage;
