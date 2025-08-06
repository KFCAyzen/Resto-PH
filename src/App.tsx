import './App.css';
import MenuPage from './MenuPage.tsx';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import CartPage from './CartPage';
import logo from './assets/WhatsApp Image 2025-07-29 à 14.49.18_44930011.jpg';
import type { MenuItem } from './types.ts';
import { menuItems } from './types.ts';
import { images } from './images.ts';

function App() {
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);

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

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fonction d’ajout au panier
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

  // Composant avec accès à l'URL
  function AppContent() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const table = query.get("table");

    useEffect(() => {
      setTableNumber(table);
    }, [table]);

    return (
      <>
        <div className='title'>
          <img src={logo} alt="PH" />
          <h1>PAULINA HÔTEL</h1>
          <nav className='navbar'>
            <Link className='menBtn' to="/" style={{ fontWeight: "bold", textDecoration: "none" }}>Menu</Link>
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
          <Route path='/panier' element={
            <CartPage
              cartItems={cartItems}
              setCartItems={setCartItems}
              tableNumber={tableNumber}
            />
          } />
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
