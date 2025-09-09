import './App.css';  
import PlatsPage from './PlatsPage';
import BoissonsPage from './BoissonsPage';
import CartPage from './CartPage';
import AdminPage from './AdminPage';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import logo from './assets/logo.jpg';
import type { MenuItem } from './types.ts';
import { images } from './images';
import { useRealtimeCollection } from './hooks/useRealtimeCollection';
import { menuItems } from './types';

function AppContent() {
  const location = useLocation();
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { items: platsItems } = useRealtimeCollection('Plats');

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCartItems(JSON.parse(storedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get("table");
    const chambreParam = params.get("chambre");
    const hp03Param = params.get("HP03");

    if (tableParam) setTable(`Table ${tableParam}`);
    else if (chambreParam) setTable(`Chambre ${chambreParam}`);
    else if (hp03Param !== null) setTable("HP03");
    else setTable(null);
  }, []);

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

  return (
    <>
      {/* HEADER */}
      <div className="title">
        <div style={{ display: "flex", alignItems: "center", gap: "35px" }}>
          <img src={logo} alt="PH" style={{ height: "50px", marginRight: "10px" }} />
          <h1>PAULINA HÔTEL</h1>
        </div>
        {location.pathname === "/admin" ? (
          <button 
            onClick={async () => {
              try {
                const { signOut } = await import('firebase/auth');
                const { auth } = await import('./firebase');
                await signOut(auth);
                window.location.href = '/';
              } catch (err) {
                console.error(err);
              }
            }}
            style={{ 
              fontSize: "0.9rem", 
              color: "#7d3837", 
              background: "none", 
              border: "none", 
              textDecoration: "underline", 
              cursor: "pointer"
            }}
          >
            <img src={images.logOut} style={{ height: "30px" }} alt="logOut" />
          </button>
        ) : (
          <Link to="/admin" style={{ fontSize: "0.9rem", color: "#7d3837", textDecoration: "underline", cursor: "pointer" }}>
            <img src={images.adminActif} style={{ height: "30px" }} alt="admin" />
          </Link>
        )}
      </div>

      {/* Barre de recherche */}
      {location.pathname !== "/panier" && location.pathname !== "/admin" && (
        <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
          <input
            type="search"
            placeholder="Rechercher un plat ou une boisson..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              width: "95%",
              borderRadius: "20px",
              border: "1px solid #7d3837",
              fontSize: "1rem",
            }}
          />
        </div>
      )}

      {/* ROUTES */}
      <Routes>
        <Route
          path="/"
          element={
            <PlatsPage
              cartItems={cartItems}
              setCartItems={setCartItems}
              onAddToCart={handleAddToCart}
              searchTerm={searchTerm}
            />
          }
        />
        <Route
          path="/boissons"
          element={
            <BoissonsPage
              cartItems={cartItems}
              setCartItems={setCartItems}
              onAddToCart={handleAddToCart}
              searchTerm={searchTerm}
            />
          }
        />
        <Route
          path="/panier"
          element={
            <CartPage
              cartItems={cartItems}
              setCartItems={setCartItems}
              localisation={table}
            />
          }
        />
        <Route
          path="/admin"
          element={<ProtectedAdminRoute />}
        />
      </Routes>

      {/* BOTTOM BAR */}
      <nav
        className="bottom-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.71)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "10px 0",
          zIndex: 1000,
        }}
      >
        <div className="menu">
          <Link to="/" style={{ textDecoration: "none", color: "black" }}>
            <img
              src={location.pathname === "/" ? images.food2 : images.food}
              alt=""
            />
          </Link>
        </div>
        <div className="menu">
          <Link to="/boissons" style={{ textDecoration: "none", color: "black" }}>
            <img
              className="bois"
              src={location.pathname === "/boissons" ? images.glass1 : images.glass}
              alt=""
            />
          </Link>
        </div>
        <div className="menu">
          <Link className="cartBtn" to="/panier">
            <img
              src={location.pathname === "/panier" ? images.carts1 : images.carts}
              alt="Panier"
            />
            <p>{cartItems.length}</p>
          </Link>
        </div>
      </nav>

      {location.pathname !== "/panier" && (
        <div
          className="vibrate"
          style={{
            position: "fixed",
            bottom: "100px",
            right: "20px",
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

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
