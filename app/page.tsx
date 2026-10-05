'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { MenuItem } from './types';
import { images } from './imagesFallback';
import { cleCommande, prixUnitaire } from './lib/menu';
import { useToast } from './hooks/useToast';

const PlatsPage = dynamic(() => import('./components/PlatsPage'), { ssr: false });
const BoissonsPage = dynamic(() => import('./components/BoissonsPage'), { ssr: false });
const CartPage = dynamic(() => import('./components/CartPage'), { ssr: false });
const ProtectedAdminRoute = dynamic(() => import('./components/ProtectedAdminRoute'), { ssr: false });

type Page = 'plats' | 'boissons' | 'panier' | 'admin';

function HomeContent() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState<Page>('plats');
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [table, setTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { showToast, toastElement } = useToast();

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      if (storedCart) setCartItems(JSON.parse(storedCart));
    } catch {
      // panier corrompu ou stockage indisponible : on repart d'un panier vide
    }
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    // Ne pas écraser le panier sauvegardé avant de l'avoir relu
    if (!cartLoaded) return;
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } catch {
      // stockage indisponible (navigation privée) : le panier reste en mémoire
    }
  }, [cartItems, cartLoaded]);

  useEffect(() => {
    const tableParam = searchParams.get("table");
    const chambreParam = searchParams.get("chambre");
    const hp03Param = searchParams.get("HP03");

    if (tableParam) setTable(`Table ${tableParam}`);
    else if (chambreParam) setTable(`Chambre ${chambreParam}`);
    else if (hp03Param !== null) setTable("HP03");
    else setTable(null);
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0 });
  };

  const handleAddToCart = (item: MenuItem) => {
    const ligne: MenuItem = { ...item, prix: prixUnitaire(item) };
    const key = cleCommande(ligne);
    setCartItems(prev =>
      prev.some(i => cleCommande(i) === key)
        ? prev.map(i => (cleCommande(i) === key ? { ...i, quantité: (i.quantité ?? 1) + 1 } : i))
        : [...prev, { ...ligne, quantité: 1 }]
    );
    showToast(`${item.nom} ajouté au panier`);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantité ?? 1), 0);
  const isMenuPage = currentPage === 'plats' || currentPage === 'boissons';

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'plats':
        return <PlatsPage onAddToCart={handleAddToCart} searchTerm={searchTerm} onClearSearch={() => setSearchTerm("")} />;
      case 'boissons':
        return <BoissonsPage onAddToCart={handleAddToCart} searchTerm={searchTerm} onClearSearch={() => setSearchTerm("")} />;
      case 'panier':
        return (
          <CartPage
            cartItems={cartItems}
            setCartItems={setCartItems}
            localisation={table}
            onBrowseMenu={() => goTo('plats')}
          />
        );
      case 'admin':
        return <ProtectedAdminRoute />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="title">
        <div className="title-left">
          <Image src="/logo.jpg" alt="Logo Paulina Hôtel" width={55} height={55} priority />
          <h1>PAULINA HÔTEL</h1>
        </div>
        <div className="title-right">
          {currentPage === "admin" ? (
            <button type="button" onClick={() => goTo('plats')} className="header-btn" aria-label="Retour au menu">
              <img src={images.backArrow} alt="" />
              <span>Menu</span>
            </button>
          ) : (
            <button type="button" onClick={() => goTo('admin')} className="header-btn" aria-label="Administration">
              <img src={images.adminActif} alt="" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* Barre de recherche */}
      {isMenuPage && (
        <div className="search-container">
          <div className="search-wrapper">
            <img src={images.search} alt="" className="search-icon" />
            <input
              type="search"
              placeholder="Rechercher un plat ou une boisson..."
              aria-label="Rechercher un plat ou une boisson"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-modern"
            />
          </div>
        </div>
      )}

      {/* CONTENU */}
      <main>{renderCurrentPage()}</main>

      {/* BOTTOM BAR */}
      <nav className="bottom-bar" aria-label="Navigation principale">
        <button
          type="button"
          className={`nav-btn ${currentPage === 'plats' ? 'active' : ''}`}
          aria-current={currentPage === 'plats' ? 'page' : undefined}
          onClick={() => goTo('plats')}
        >
          <img src={currentPage === "plats" ? images.food2 : images.food} alt="" />
          <span>Plats</span>
        </button>
        <button
          type="button"
          className={`nav-btn ${currentPage === 'boissons' ? 'active' : ''}`}
          aria-current={currentPage === 'boissons' ? 'page' : undefined}
          onClick={() => goTo('boissons')}
        >
          <img src={currentPage === "boissons" ? images.glass1 : images.glass} alt="" />
          <span>Boissons</span>
        </button>
        <button
          type="button"
          className={`nav-btn ${currentPage === 'panier' ? 'active' : ''}`}
          aria-current={currentPage === 'panier' ? 'page' : undefined}
          aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
          onClick={() => goTo('panier')}
        >
          <img src={currentPage === "panier" ? images.carts1 : images.carts} alt="" />
          <span>Panier</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </nav>

      {isMenuPage && showScrollTop && (
        <button
          type="button"
          className="scroll-top-btn"
          aria-label="Revenir en haut de la page"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img src={images.up} alt="" />
        </button>
      )}

      {toastElement}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="page-loader"><div className="spinner" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
