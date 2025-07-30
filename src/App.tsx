// import React from 'react';
import './App.css';
import MenuPage from './MenuPage.tsx';
import logo from './assets/WhatsApp Image 2025-07-29 à 14.49.18_44930011.jpg'

function App() {
  return (
    <div className="app">
      <div className='title'>
        <img src={logo} alt="PH" />
        <h1>PAULINA HÔTEL</h1>
      </div>
      <h2>Menu du Restaurant</h2>
      <MenuPage />
    </div>
  );
}

export default App;
