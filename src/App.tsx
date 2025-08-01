import './App.css';
import MenuPage from './MenuPage.tsx';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CartPage from './CartPage';
import logo from './assets/WhatsApp Image 2025-07-29 à 14.49.18_44930011.jpg';
import { MenuItem } from './types.ts';  
import { images } from './images.ts';

function App() {
  const [cartItems, setCartItems] = useState<MenuItem[]>([]); 

  return (
    <Router>
      <div className='title'>
        <img src={logo} alt="PH" />
        <h1>PAULINA HÔTEL</h1>
         <nav className='navbar'>
        <Link className='menBtn' to="/" style={{ fontWeight: "bold", textDecoration: "none"}}>Menu</Link>
        <Link className='cartBtn' to="/panier" style={{ fontWeight: "bold", textDecoration: "none", color: "black"}}><img src={images.cart} /><p>{cartItems.length}</p> </Link>
      </nav>
      </div>

      <Routes>
        <Route path='/' element={<MenuPage cartItems={cartItems} setCartItems={setCartItems} />} />
        <Route path='/panier' element={<CartPage cartItems={cartItems} />} />
      </Routes>
    </Router>
  );
}

export default App;
