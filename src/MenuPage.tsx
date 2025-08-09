import React, { useState } from 'react';
import type { MenuItem } from './types';

type Props = {
  items: MenuItem[]; // La liste des produits à afficher
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  onAddToCart: (item: MenuItem) => void;
  category?: string; // catégorie optionnelle pour filtrer l’affichage
  searchTerm?: string; // terme de recherche optionnel
};

const MenuPage: React.FC<Props> = ({
  items,
  cartItems,
  setCartItems,
  onAddToCart,
  category,
  searchTerm = '',
}) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tout'); // Catégorie active

  // --- Liste de toutes les catégories disponibles à partir des items ---
  const allCategories = Array.from(new Set(items.flatMap(item => item.catégorie)));
  const categories = ['Tout', ...allCategories];

  // --- Filtrage de base si une catégorie est passée via les props ---
  const initialFilteredItems = category
    ? items.filter(item =>
        item.catégorie.map(c => c.toLowerCase()).includes(category.toLowerCase())
      )
    : items;

  // --- Application du filtre en fonction de la catégorie choisie via les boutons ---
  // Et filtrage par recherche (searchTerm) insensible à la casse
  const finalFilteredItems =
    selectedCategory === 'Tout'
      ? initialFilteredItems.filter(item =>
          item.nom.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : initialFilteredItems
          .filter(item => item.catégorie.includes(selectedCategory))
          .filter(item =>
            item.nom.toLowerCase().includes(searchTerm.toLowerCase())
          );

  // --- Regrouper les produits par catégorie (selon finalFilteredItems) ---
  const groupedItems = finalFilteredItems.reduce((acc: { [key: string]: MenuItem[] }, item) => {
    item.catégorie.forEach((cat) => {
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
    });
    return acc;
  }, {});

  return (
    <div>
      {/* --- Boutons de sélection de catégories --- */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingBottom: '5px',
        }}
      >
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 10px',
              borderRadius: '15px',
              border: selectedCategory === cat ? "none" : '1px solid #7d3837',
              backgroundColor: selectedCategory === cat ? '#7d3837' : '#fff',
              color: selectedCategory === cat ? 'white' : '#7d3837',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* --- Affichage des produits par catégorie --- */}
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

      {/* --- Fenêtre modale pour les détails du produit --- */}
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
