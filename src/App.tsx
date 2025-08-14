import './App.css';
import MenuPage from './MenuPage.tsx';
import BoissonsPage from './BoissonsPage';
import CartPage from './CartPage';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import logo from './assets/logo.jpg';
import type { MenuItem } from './types.ts';
import { menuItems } from './types.ts';
import { images } from './images.ts';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(''); // State pour la recherche

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

  // Ajout au panier
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

  const isCartPage = location.pathname === "/panier";

  return (
    <>
      {/* Barre de titre */}
      <div className='title'>
        {isCartPage ? (
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.71)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(124, 124, 124, 0.71)',
              color: '#7d3837',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1.5rem',
              width: '100%',
              position: 'absolute',
              top: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '80px',
              fontWeight: '600'
            }}
          ><img src={images.back} alt="" />
             Retour
          </button>
        ) : (
          <>
            <img src={logo} alt="PH" />
            <h1>PAULINA HÔTEL</h1>
          </>
        )}

        <nav className='navbar'>
          {/* Bouton Panier caché sur page panier */}
          {!isCartPage && (
            <Link
              className='cartBtn'
              to="/panier"
              style={{ fontWeight: "bold", textDecoration: "none", color: "black" }}
            >
              <img src={images.cart} alt="Panier" />
              <p>{cartItems.length}</p>
            </Link>
          )}
        </nav>
      </div>

      {/* Barre recherche + boutons menu/boissons uniquement si PAS sur la page panier */}
      {!isCartPage && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <input
              type="search"
              placeholder="Rechercher un plat ou une boisson..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.6rem 1rem',
                width: '95%',
                borderRadius: '20px',
                border: '1px solid #7d3837',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', gap: '10px' }}>
            <Link
              to="/"
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#7d3837',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '5px',
                textDecoration: 'none',
                textAlign: 'center',
                minWidth: '150px',
                cursor: 'pointer',
              }}
            >
              Menu
            </Link>
            <Link
              to="/boissons"
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#7d3837',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '5px',
                textDecoration: 'none',
                textAlign: 'center',
                minWidth: '150px',
                cursor: 'pointer',
              }}
            >
              Boissons
            </Link>
          </div>
        </>
      )}

      {/* Routes */}
      <Routes>
        <Route
          path='/'
          element={
            <MenuPage
              items={menuItems}
              cartItems={cartItems}
              setCartItems={setCartItems}
              onAddToCart={handleAddToCart}
              searchTerm={searchTerm}
            />
          }
        />
        <Route
          path='/boissons'
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

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
