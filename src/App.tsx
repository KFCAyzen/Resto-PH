import './App.css';
import MenuPage from './MenuPage.tsx';
import CartPage from './CartPage';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import logo from './assets/logo.jpg';
import type { MenuItem } from './types.ts';
import { menuItems } from './types.ts';
import { images } from './images.ts';

function App() {
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<string | null>(null); 

  // Charger le panier au démarrage
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const parsedCart: MenuItem[] = JSON.parse(storedCart);
      const updatedCart = parsedCart.map(item => {
        const match = menuItems.find(m => m.id === item.id);
        return match ? { ...match, quantité: item.quantité } : item;
      });
      setCartItems(updatedCart);
    }
  }, []);

  // Sauvegarder dans localStorage à chaque changement de panier
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Récupérer la localisation depuis les paramètres de l’URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get("table");
    const chambreParam = params.get("chambre");
    const hp03Param = params.get("HP03");

    if (tableParam) {
      setTable(`Table ${tableParam}`);
    } else if (chambreParam) {
      setTable(`Chambre ${chambreParam}`);
    } else if (hp03Param !== null) {
      setTable("HP03");
    } else {
      setTable(null); // Rien détecté
    }
  }, []);

  // ✅ Ajout au panier
  const handleAddToCart = (item: MenuItem) => {
    const existingItem = cartItems.find(i => i.id === item.id);
    if (existingItem) {
      const updatedCart = cartItems.map(i =>
        i.id === item.id ? { ...i, quantité: (i.quantité ?? 0) + 1 } : i
      );
      setCartItems(updatedCart);
    } else {
      setCartItems([...cartItems, { ...item, quantité: 1 }]);
    }
  };

  function AppContent() {
    return (
      <>
        <div className='title'>
          <img src={logo} alt="PH" />
          <h1>PAULINA HÔTEL</h1>
          <nav className='navbar'>
            <Link className='menBtn' to="/" style={{ fontWeight: "bold", textDecoration: "none" }}>
              Menu
            </Link>
            <Link className='cartBtn' to="/panier" style={{ fontWeight: "bold", textDecoration: "none", color: "black" }}>
              <img src={images.cart} />
              <p>{cartItems.length}</p>
            </Link>
          </nav>
        </div>

        <Routes>
          <Route
            path='/'
            element={
              <MenuPage
                cartItems={cartItems}
                setCartItems={setCartItems}
                onAddToCart={handleAddToCart}
              />
            }
          />
          <Route
            path='/panier'
            element={
              <CartPage
                cartItems={cartItems}
                setCartItems={setCartItems}
                localisation={table}            
              />
            }
          />
        </Routes>
      </>
    );
  }

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
