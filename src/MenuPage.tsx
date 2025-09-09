import React, { useState, useEffect, useRef } from 'react';
import type { MenuItem } from './types';
import { images } from './images';

type Props = {
  items: MenuItem[];
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  onAddToCart: (item: MenuItem) => void;
  category?: string;
  searchTerm?: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('Tout');
  const [loading, setLoading] = useState(true);
  const [selectedPrice, setSelectedPrice] = useState<string>(""); // prix choisi (radio)

  // --- Simuler chargement ---
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const allCategories = Array.from(new Set(items.flatMap(item => item.catégorie)));
  const categories = ['Tout', ...allCategories];

  const initialFilteredItems = category
    ? items.filter(item =>
        item.catégorie.map(c => c.toLowerCase()).includes(category.toLowerCase())
      )
    : items;

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

  const groupedItems = finalFilteredItems.reduce((acc: { [key: string]: MenuItem[] }, item) => {
    item.catégorie.forEach(cat => {
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
    });
    return acc;
  }, {});

  const itemsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = entry.target.getAttribute('data-index');
            setTimeout(() => entry.target.classList.add('visible'), Number(index) * 100);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(itemsRef.current).forEach(item => item && observer.observe(item));

    return () => observer.disconnect();
  }, [groupedItems]);

  return (
    <div>
      {/* --- Boutons catégories --- */}
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
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
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
        <style>{`.scroll-container::-webkit-scrollbar { display: none; }`}</style>
      </div>

      {/* --- Skeleton ou Produits --- */}
      {loading ? (
        <div className="skeleton-container">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-img"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-text"></div>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(groupedItems).map(([catégorie, items]) => (
          <div key={catégorie} className="menu-section">
            <h2 className="categorie-title">{catégorie}</h2>
            <div className="menu-items">
              {items.map((item, index) => {
                const uniqueKey = `${catégorie}-${item.id}`;
                return (
                 <div
                  key={uniqueKey}
                  ref={el => { itemsRef.current[uniqueKey] = el; }}
                  className="menuitem hidden"
                  data-index={index}
                  onClick={() => {
                    setSelectedItem(item);
                    if (Array.isArray(item.prix)) {
                      setSelectedPrice(""); // reset la sélection
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {item.image && <img src={item.image} alt={item.nom} />}
                  <h3>{item.nom}</h3>
                  <p>
                    {Array.isArray(item.prix)
                      ? `À partir de ${Math.min(
                          ...item.prix.map(opt => parseInt(opt.value.replace(/\D/g, ""), 10))
                        )} FCFA`
                      : item.prix}
                  </p>
                </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* --- Modal --- */}
      {selectedItem && (
        <>
          <div className="overlay" onClick={() => setSelectedItem(null)}></div>
          <div className="modal">
            <h2>{selectedItem.nom}</h2>
            {selectedItem.image && <img src={selectedItem.image} alt={selectedItem.nom} />}
            <p><strong>Description :</strong> {selectedItem.description}</p>

            {Array.isArray(selectedItem.prix) ? (
              <div>
                <p><strong>Choisissez une option :</strong></p>
                {selectedItem.prix.map((opt, idx) => (
                  <div className='choise' key={idx}>
                    <input
                      type="radio"
                      id={`price-${idx}`}
                      name={`prix-${selectedItem.id}`}
                      value={opt.value}
                      checked={selectedPrice === opt.value}
                      onChange={() => setSelectedPrice(opt.value)}
                    />
                    <label htmlFor={`price-${idx}`}>{opt.label} - {opt.value}</label>
                  </div>
                ))}
              </div>
            ) : (
              <p><strong>Prix :</strong> {selectedItem.prix}</p>
            )}

            <div className="buttons">
              <button
                className="addBtn"
                onClick={() => {
                  if (Array.isArray(selectedItem.prix)) {
                    const selectedOption = selectedItem.prix.find(opt => opt.value === selectedPrice);
                    if (selectedOption) {
                      onAddToCart({
                        ...selectedItem,
                        nom: `${selectedItem.nom} (${selectedOption.label})`, // Ajout du label dans le nom
                        prix: selectedOption.value,
                      });
                    }
                  } else {
                    onAddToCart({
                      ...selectedItem,
                      prix: selectedItem.prix as string,
                    });
                  }
                  setSelectedItem(null);
                  setSelectedPrice("");
                }}
                disabled={Array.isArray(selectedItem.prix) && !selectedPrice} // bouton désactivé si aucune option sélectionnée
                style={{
                  backgroundColor: Array.isArray(selectedItem.prix) && !selectedPrice ? '#7d383780' : '#7d3837',
                  cursor: Array.isArray(selectedItem.prix) && !selectedPrice ? 'not-allowed' : 'pointer',
                  color: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  fontWeight: "bold",
                  transition: 'background-color 0.3s ease-in',
                  marginTop: '15px'
                }}
              >
                Ajouter au panier
              </button>
              <button className="close" onClick={() => setSelectedItem(null)}>Fermer</button>
            </div>
          </div>
        </>
      )}

      {/* --- Footer --- */}
      <section className="footer">
        <h2>Contactez nous</h2>
        <div className="tel">
          <img src={images.phone} alt="" />
          <p className="num"><span>Téléphone:</span> +237 657 011 948 / 675 026 289</p>
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
            <a href="https://www.facebook.com/share/19eJEP4m5g/?mibextid=wwXIfr">
              <img src={images.facebook} alt="" />
            </a>
            <p>FaceBook</p>
          </div>
          <div>
            <a href="https://www.tiktok.com/@paulina.hotel21?_t=ZM-8ycfR0dU40s&_r=1">
              <img src={images.tiktok} alt="" />
            </a>
            <p>TikTok</p>
          </div>
          <div>
            <a href="https://wa.link/zxqlo7">
              <img src={images.whatsapp} alt="" />
            </a>
            <p>WhatsApp</p>
          </div>
        </div>
        <footer>Copyright Paulina Hôtel 2025 all rights reserved</footer>
      </section>
    </div>
  );
};

export default MenuPage;
