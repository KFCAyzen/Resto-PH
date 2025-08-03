import React, { useState } from 'react';
import type { MenuItem } from './types';
import { menuItems } from './types';

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  onAddToCart: (item: MenuItem) => void;
};

const MenuPage: React.FC<Props> = ({ cartItems, setCartItems, onAddToCart }) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const groupedItems = menuItems.reduce((acc: { [key: string]: MenuItem[] }, item) => {
    item.catégorie.forEach((cat) => {
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
    });
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(groupedItems).map(([catégorie, items]) => (
        <div key={catégorie} className='menu-section'>
          <h2 className='categorie-title'>{catégorie}</h2>
          <div className="menu-items">
            {items.map((item) => (
              <div
                key={`${catégorie}-${item.id}`}
                className='menuitem'
                onClick={() => setSelectedItem(item)}
                style={{ cursor: 'pointer' }}
              >
                <img src={item.image} alt={item.nom} />
                <h3>{item.nom}</h3>
                <p>{item.prix}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedItem && (
        <>
          <div className="overlay" onClick={() => setSelectedItem(null)}></div>
          <div className="modal">
            <h2>{selectedItem.nom}</h2>
            <img src={selectedItem.image} alt={selectedItem.nom} />
            <p><strong>Description :</strong> {selectedItem.description}</p>
            <p><strong>Prix :</strong> {selectedItem.prix}</p>
            <div className="buttons">
              <button
                className='addBtn'
                onClick={() => {
                  onAddToCart(selectedItem);
                  setSelectedItem(null);
                }}
              >
                Ajouter au panier
              </button>
              <button className='close' onClick={() => setSelectedItem(null)}>Fermer</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MenuPage;
