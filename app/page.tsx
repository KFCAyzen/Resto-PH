'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { MenuItem } from './types';
import { images } from './imagesFallback';

const PlatsPage = dynamic(() => import('./components/PlatsPage'), { ssr: false });
const BoissonsPage = dynamic(() => import('./components/BoissonsPage'), { ssr: false });
const CartPage = dynamic(() => import('./components/CartPage'), { ssr: false });
const ProtectedAdminRoute = dynamic(() => import('./components/ProtectedAdminRoute'), { ssr: false });
const HistoriquePage = dynamic(() => import('./components/HistoriquePage'), { ssr: false });

function HomeContent() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState<'plats' | 'boissons' | 'panier' | 'admin' | 'historique'>('plats');
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");


  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCartItems(JSON.parse(storedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const tableParam = searchParams.get("table");
    const chambreParam = searchParams.get("chambre");
    const hp03Param = searchParams.get("HP03");

    if (tableParam) setTable(`Table ${tableParam}`);
    else if (chambreParam) setTable(`Chambre ${chambreParam}`);
    else if (hp03Param !== null) setTable("HP03");
    else setTable(null);
  }, [searchParams]);

  const prixToString = (
    prix: string | { label: string; value: string; selected?: boolean }[]
  ): string => {
    if (typeof prix === "string") return prix;
    if (Array.isArray(prix)) {
      const selected = prix.find((p) => p.selected);
      return selected ? selected.value : prix[0].value;
    }
    return "";
  };

  const handleAddToCart = (item: MenuItem) => {
    const prixStr = prixToString(item.prix);
    const uniqueKey = `${item.id}-${prixStr}`;

    const existingItem = cartItems.find(
      (i) => `${i.id}-${prixToString(i.prix)}` === uniqueKey
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((i) =>
          `${i.id}-${prixToString(i.prix)}` === uniqueKey
            ? { ...i, quantité: (i.quantité ?? 0) + 1 }
            : i
        )
      );
    } else {
      setCartItems([...cartItems, { ...item, prix: prixStr, quantité: 1 }]);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'plats':
        return (
          <PlatsPage
            cartItems={cartItems}
            setCartItems={setCartItems}
            onAddToCart={handleAddToCart}
            searchTerm={searchTerm}
          />
        );
      case 'boissons':
        return (
          <BoissonsPage
            cartItems={cartItems}
            setCartItems={setCartItems}
            onAddToCart={handleAddToCart}
            searchTerm={searchTerm}
          />
        );
      case 'panier':
        return (
          <CartPage
            cartItems={cartItems}
            setCartItems={setCartItems}
            localisation={table}
          />
        );
      case 'admin':
        return <ProtectedAdminRoute />;
      case 'historique':
        return <HistoriquePage />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="title">
        <div className="title-left">
          <Image src="/logo.jpg" alt="PH" width={55} height={55} />
          <h1>PAULINA HÔTEL</h1>
        </div>
        <div className="title-right">
          {currentPage === "admin" ? (
            <button 
              className="logout-btn"
              onClick={async () => {
                try {
                  const { signOut } = await import('firebase/auth');
                  const { auth } = await import('./firebase');
                  await signOut(auth);
                  setCurrentPage('plats');
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              <img src={images.logOut} alt="logOut" />
              <span>Déconnexion</span>
            </button>
          ) : (
            <button onClick={() => setCurrentPage('admin')} className="admin-link">
              <img src={images.adminActif} alt="admin" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      {currentPage !== "panier" && currentPage !== "admin" && currentPage !== "historique" && (
        <div className="search-container">
          <div className="search-wrapper">
            <img src={images.search} alt="search" className="search-icon" />
            <input
              type="search"
              placeholder="Rechercher un plat ou une boisson..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-modern"
            />
          </div>
        </div>
      )}

      {/* CONTENU */}
      {renderCurrentPage()}

      {/* BOTTOM BAR */}
      <nav className="bottom-bar" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "10px 0",
        zIndex: 1000,
      }}>
        <div className="menu">
          <button onClick={() => setCurrentPage('plats')} style={{ background: 'none', border: 'none' }}>
            <img
              src={currentPage === "plats" ? images.food2 : images.food}
              alt="plats"
            />
          </button>
        </div>
        <div className="menu">
          <button onClick={() => setCurrentPage('boissons')} style={{ background: 'none', border: 'none' }}>
            <img
              className="bois"
              src={currentPage === "boissons" ? images.glass1 : images.glass}
              alt="boissons"
            />
          </button>
        </div>
        <div className="menu">
          <button className="cartBtn" onClick={() => setCurrentPage('panier')} style={{ background: 'none', border: 'none' }}>
            <img
              src={currentPage === "panier" ? images.carts1 : images.carts}
              alt="Panier"
            />
            <p>{cartItems.length}</p>
          </button>
        </div>
      </nav>

      {currentPage !== "panier" && currentPage !== "admin" && (
        <div
          className="vibrate"
          style={{
            position: "fixed",
            bottom: "100px",
            right: "35px",
            display: "flex",
            border: "none",
            borderRadius: "30px",
            cursor: "pointer",
            fontWeight: "600",
            zIndex: 1000,
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img
            src={images.up}
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              borderRadius: "25px",
              height: "50px",
            }}
            alt=""
          />
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <HomeContent />
    </Suspense>
  );
}