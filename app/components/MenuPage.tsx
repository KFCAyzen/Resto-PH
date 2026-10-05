import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { MenuItem } from '../types';
import { images } from '../imagesFallback';
import { formatPrixTexte, normaliser, prixAffiche, prixMinimum, PRIX_SUR_DEMANDE } from '../lib/menu';

type Props = {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  onAddToCart: (item: MenuItem) => void;
  searchTerm?: string;
  onClearSearch?: () => void;
};

const MenuPage: React.FC<Props> = ({
  items,
  loading,
  error,
  onAddToCart,
  searchTerm = '',
  onClearSearch,
}) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tout');
  const [selectedPrice, setSelectedPrice] = useState<string>(""); // prix choisi (radio)

  // Items masqués exclus, tri par prix croissant ; les items sans prix (accompagnements) en dernier
  const sortedItems = useMemo(
    () =>
      items
        .filter(item => item.masque !== true)
        .sort((a, b) => (prixMinimum(a) ?? Infinity) - (prixMinimum(b) ?? Infinity)),
    [items]
  );

  const categories = useMemo(
    () => ['Tout', ...Array.from(new Set(sortedItems.flatMap(item => item.catégorie)))],
    [sortedItems]
  );

  const recherche = normaliser(searchTerm);
  const filteredItems = sortedItems
    .filter(item => selectedCategory === 'Tout' || item.catégorie.includes(selectedCategory))
    .filter(item => !recherche || normaliser(`${item.nom} ${item.catégorie.join(' ')}`).includes(recherche));

  const groupedItems = filteredItems.reduce((acc: { [key: string]: MenuItem[] }, item) => {
    item.catégorie.forEach(cat => {
      if (selectedCategory !== 'Tout' && cat !== selectedCategory) return;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
    });
    return acc;
  }, {});

  const closeModal = () => {
    setSelectedItem(null);
    setSelectedPrice("");
  };

  // Bloquer le défilement de la page et fermer avec Échap quand la fenêtre est ouverte
  useEffect(() => {
    if (!selectedItem) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedItem]);

  // Apparition progressive des cartes quand elles entrent dans l'écran
  const itemsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const renderKey = `${selectedCategory}|${recherche}|${filteredItems.map(i => i.id).join(',')}`;

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries
          .filter(entry => entry.isIntersecting)
          .forEach((entry, i) => {
            // Décalage limité aux cartes qui apparaissent ensemble, pour ne jamais faire attendre
            setTimeout(() => entry.target.classList.add('is-visible'), Math.min(i, 6) * 60);
            observer.unobserve(entry.target);
          });
      },
      { threshold: 0.1 }
    );

    Object.values(itemsRef.current).forEach(el => {
      if (el && !el.classList.contains('is-visible')) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [renderKey, loading]);

  const isArrayPrice = selectedItem !== null && Array.isArray(selectedItem.prix);

  const addSelectedToCart = () => {
    if (!selectedItem) return;
    if (Array.isArray(selectedItem.prix)) {
      const selectedOption = selectedItem.prix.find(opt => opt.value === selectedPrice);
      if (!selectedOption) return;
      onAddToCart({
        ...selectedItem,
        nom: `${selectedItem.nom} (${selectedOption.label})`, // Ajout du label dans le nom
        prix: selectedOption.value,
      });
    } else {
      onAddToCart({ ...selectedItem, prix: selectedItem.prix });
    }
    closeModal();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="skeleton-container" aria-label="Chargement du menu">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-img"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-text"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="menu-empty" role="alert">
          <p>Impossible de charger le menu pour le moment.</p>
          <button type="button" onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <div className="menu-empty">
          {recherche ? (
            <>
              <p>Aucun résultat pour « {searchTerm.trim()} ».</p>
              {onClearSearch && <button type="button" onClick={onClearSearch}>Effacer la recherche</button>}
            </>
          ) : (
            <p>Aucun article disponible pour le moment.</p>
          )}
        </div>
      );
    }

    return Object.entries(groupedItems).map(([catégorie, items]) => (
      <section key={catégorie} className="menu-section">
        <h2 className="categorie-title">{catégorie}</h2>
        <div className="menu-items">
          {items.map(item => {
            const uniqueKey = `${catégorie}-${item.id}`;
            const prix = prixAffiche(item);
            return (
              <button
                type="button"
                key={uniqueKey}
                ref={el => { itemsRef.current[uniqueKey] = el; }}
                className="menuitem reveal"
                onClick={() => {
                  setSelectedItem(item);
                  setSelectedPrice("");
                }}
              >
                {item.image && <img src={item.image} alt="" loading="lazy" decoding="async" />}
                <span className="menuitem-name" title={item.nom}>{item.nom}</span>
                <span className={`prix ${prix === PRIX_SUR_DEMANDE ? 'prix-sur-demande' : ''}`}>{prix}</span>
              </button>
            );
          })}
        </div>
      </section>
    ));
  };

  return (
    <div>
      {/* --- Boutons catégories --- */}
      {!loading && !error && (
        <div className="category-chips" role="group" aria-label="Catégories">
          {categories.map(cat => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {renderContent()}

      {/* --- Modal --- */}
      {selectedItem && (
        <>
          <div className="overlay" onClick={closeModal}></div>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">{selectedItem.nom}</h2>
            {selectedItem.image && <img src={selectedItem.image} alt={selectedItem.nom} decoding="async" />}
            {selectedItem.description?.trim() && (
              <p><strong>Description :</strong> {selectedItem.description}</p>
            )}

            {Array.isArray(selectedItem.prix) ? (
              <fieldset className="price-choices">
                <legend><strong>Choisissez une option :</strong></legend>
                {selectedItem.prix.map((opt, idx) => (
                  <label className="price-choice" key={idx}>
                    <input
                      type="radio"
                      name={`prix-${selectedItem.id}`}
                      value={opt.value}
                      checked={selectedPrice === opt.value}
                      onChange={() => setSelectedPrice(opt.value)}
                    />
                    <span>{opt.label}</span>
                    <span>{formatPrixTexte(opt.value)}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <p><strong>Prix :</strong> {prixAffiche(selectedItem)}</p>
            )}

            <div className="buttons">
              <button
                type="button"
                className="addBtn"
                onClick={addSelectedToCart}
                disabled={isArrayPrice && !selectedPrice} // bouton désactivé si aucune option sélectionnée
              >
                Ajouter au panier
              </button>
              <button type="button" className="close" onClick={closeModal}>Fermer</button>
            </div>
          </div>
        </>
      )}

      {/* --- Footer --- */}
      <section className="footer">
        <div className="footer-inner">
          <h2>Contactez-nous</h2>
          <div className="contact-line">
            <img src={images.phone} alt="" />
            <span>
              <a className="contact-link" href="tel:+237657011948">+237 657 011 948</a>
              {" / "}
              <a className="contact-link" href="tel:+237675026289">675 026 289</a>
            </span>
          </div>
          <a className="contact-line" href="mailto:paulinahotel@yahoo.com">
            <img src={images.mail} alt="" />
            <span>paulinahotel@yahoo.com</span>
          </a>
          <div className="contact-line">
            <img src={images.loc} alt="" />
            <span>À 500 m de l'Abattoir</span>
          </div>
          <div className="socials">
            <a href="https://www.facebook.com/share/19eJEP4m5g/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
              <img src={images.facebook} alt="" />
              <span>Facebook</span>
            </a>
            <a href="https://www.tiktok.com/@paulina.hotel21?_t=ZM-8ycfR0dU40s&_r=1" target="_blank" rel="noopener noreferrer">
              <img src={images.tiktok} alt="" />
              <span>TikTok</span>
            </a>
            <a href="https://wa.link/zxqlo7" target="_blank" rel="noopener noreferrer">
              <img src={images.whatsapp} alt="" />
              <span>WhatsApp</span>
            </a>
          </div>
          <footer>© {new Date().getFullYear()} Paulina Hôtel. Tous droits réservés.</footer>
        </div>
      </section>
    </div>
  );
};

export default MenuPage;
