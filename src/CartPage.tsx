import React, { useState } from 'react';
import type { MenuItem } from './types';
import './App.css';
import './index.css'

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  localisation: string | null; // Peut être table, chambre ou HP03
};

const CartPage: React.FC<Props> = ({ cartItems, setCartItems, localisation }) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item =>
          item.id === id
            ? { ...item, quantité: (item.quantité || 1) + delta }
            : item
        )
        .filter(item => (item.quantité || 1) > 0)
    );
  };

  const handleClearCart = () => {
    const confirmed = window.confirm("Es-tu sûr de vouloir vider tout le panier ?");
    if (confirmed) {
      setCartItems([]);
      localStorage.removeItem("cart");
    }
  };

  const totalPrix = cartItems.reduce((acc, item) => {
    const prix = parsePrix(item.prix);
    return acc + prix * (item.quantité || 1);
  }, 0);

  const handleCommander = () => {
    if (cartItems.length === 0) {
      alert("Ton panier est vide.");
      return;
    }

    const phoneNumber = "237657011948";

    const message = encodeURIComponent(
      `Bonjour, j'aimerais commander les articles suivants :\n\n` +
      cartItems.map(item =>
        `- ${item.nom} x${item.quantité} (${item.prix})`
      ).join("\n") +
      `\n\nTotal: ${formatPrix(totalPrix)}` +
      `\nLocalisation : ${localisation || 'Non spécifiée'}` +
      `\nNom : ${nom}\nPrénom : ${prenom}`
    );

    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, "_blank");
  };

  return (
    <div className='cartContent'>
      <h1 className='hcart'>Votre Panier</h1>

      {cartItems.length === 0 ? (
        <p>Le panier est vide.</p>
      ) : (
        <div>
          <ul className='itemList'>
            {cartItems.map((item) => (
              <li key={item.id} style={{ marginBottom: '1rem' }}>
                <div>
                  <strong>{item.nom}</strong> - {item.prix} × {item.quantité} ={" "}
                  {formatPrix((item.quantité || 1) * parsePrix(item.prix))}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    style={buttonStyle("-")}
                  >
                    -
                  </button>
                  <span style={{ margin: '0 1rem' }}>{item.quantité}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    style={buttonStyle("+")}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <hr />
          <h2>Total : {formatPrix(totalPrix)}</h2>

          <div className="form">
            <h2>Informations Client</h2>
            <div className="inputs">
              <input
                type="text"
                placeholder='Nom'
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
              <input
                type="text"
                placeholder='Prénom'
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
          </div>

          <div className='CartBtns' style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleClearCart}
              style={{
                backgroundColor: '#c0392b',
                color: 'white',
                padding: '0.7rem 1.2rem',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Vider le panier
            </button>

            <button
              onClick={handleCommander}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                padding: '0.7rem 1.2rem',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Commander
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function parsePrix(prix: string): number {
  return parseInt(prix.replace(/[^\d]/g, ""), 10);
}

function formatPrix(valeur: number): string {
  return valeur.toLocaleString('fr-FR') + ' FCFA';
}

function buttonStyle(type: "+" | "-") {
  return {
    padding: '0.5rem 1rem',
    backgroundColor: type === "+" ? '#4CAF50' : '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };
}

export default CartPage;
