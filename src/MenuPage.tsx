import React, { useState, useEffect, useRef } from 'react';
import type { MenuItem } from './types';
import { images } from './images';

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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null); // Item sélectionné pour le modal
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

  // --- Ref pour tous les items afin de gérer l'animation ---
  const itemsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // --- Effet IntersectionObserver pour animation au scroll ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = entry.target.getAttribute('data-index');
            setTimeout(() => {
              entry.target.classList.add('visible'); // Ajouter la classe visible quand l'élément entre dans le viewport
            }, Number(index) * 100);
            observer.unobserve(entry.target); // On stop l'observation après apparition
          }
        });
      },
      { threshold: 0.1 } // 10% visible pour déclencher
    );

    // Observer tous les items
    Object.values(itemsRef.current).forEach(item => item && observer.observe(item));

    return () => observer.disconnect();
  }, [groupedItems]);

  return (
    <div>
      {/* --- Boutons de sélection de catégories --- */}
      <div
        className="scroll-container"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingBottom: '5px',
          width: '95%',
          marginLeft: '10px',
          scrollbarWidth: 'none',      // Firefox
          msOverflowStyle: 'none',     // IE 10+
        }}
      >
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 10px',
              borderRadius: '15px',
              border: selectedCategory === cat ? 'none' : '1px solid #7d3837',
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

        {/* CSS inline pour cacher la scrollbar sur Chrome, Safari, Opera */}
        <style>{`
          .scroll-container::-webkit-scrollbar { display: none; }
        `}</style>
      </div>

      {/* --- Affichage des produits par catégorie --- */}
      {Object.entries(groupedItems).map(([catégorie, items]) => (
        <div key={catégorie} className='menu-section'>
          <h2 className='categorie-title'>{catégorie}</h2>
          <div className="menu-items">
            {items.map((item, index) => {
              const uniqueKey = `${catégorie}-${item.id}`;
              return (
                <div
                  key={uniqueKey}
                  ref={(el: HTMLDivElement | null) => {
                    itemsRef.current[uniqueKey] = el; // Références uniques pour IntersectionObserver
                  }}
                  className='menuitem hidden' // Classe de base pour animation
                  data-index={index} // Utilisé pour le stagger
                  onClick={() => setSelectedItem(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={item.image} alt={item.nom} />
                  <h3>{item.nom}</h3>
                  <p>{item.prix}</p>
                </div>
              );
            })}
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

      {/* --- Footer --- */}
      <section className='footer'>
        <h2>Contactez nous</h2>
        <div className="tel">
          <img src={images.phone} alt="" />
          <p className='num'><span>Téléphone:</span> (+237) 657 01 19 48 / 675 02 62 89</p>
        </div>
        <div className="mail">
          <img src={images.mail} alt="" />
          <p>paulinahotel@yahoo.com</p>
        </div>
        <div className="loc">
          <img src={images.loc} alt="" />
          <p>A 500m de Abattoir</p>
        </div>
        <div className="socials">
          <div>
            <a href="https://www.facebook.com/share/19eJEP4m5g/?mibextid=wwXIfr"><img src={images.facebook} alt="" /></a>
            <p>FaceBook</p>
          </div>
          <div>
            <a href="https://www.tiktok.com/@paulina.hotel21?_t=ZM-8ycfR0dU40s&_r=1"><img src={images.tiktok} alt="" /></a>
            <p>TikTok</p>
          </div>
          <div>
            <a href="https://wa.link/zxqlo7"><img src={images.whatsapp} alt="" /></a>
            <p>WhatsApp</p>
          </div>
        </div>
        <footer>Copyright Paulina Hôtel 2025 all rights reserved</footer>
      </section>
    </div>
  );
};

export default MenuPage;
