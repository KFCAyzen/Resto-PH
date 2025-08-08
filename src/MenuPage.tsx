import React, { useState } from 'react';
import type { MenuItem } from './types';

type Props = {
  items: MenuItem[]; // La liste des produits à afficher
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  onAddToCart: (item: MenuItem) => void;
  category?: string; // catégorie optionnelle pour filtrer l’affichage
};

const MenuPage: React.FC<Props> = ({ items, cartItems, setCartItems, onAddToCart, category }) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Filtrer les items selon la catégorie si elle est spécifiée
  const filteredItems = category
    ? items.filter(item => item.catégorie.map(c => c.toLowerCase()).includes(category.toLowerCase()))
    : items;

  // Regrouper les produits par catégorie (selon filteredItems)
  const groupedItems = filteredItems.reduce((acc: { [key: string]: MenuItem[] }, item) => {
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
