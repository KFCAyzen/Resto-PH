import React from 'react';
import type { MenuItem } from './types';

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
};

const CartPage: React.FC<Props> = ({ cartItems, setCartItems }) => {
  const updateQuantity = (id: number, delta: number) => {
    const updatedCart = cartItems
      .map(item =>
        item.id === id
          ? { ...item, quantité: (item.quantité || 1) + delta }
          : item
      )
      .filter(item => (item.quantité || 1) > 0);

    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart)); // 🔁 synchro
  };

  const handleClearCart = () => {
    const confirmed = window.confirm("Es-tu sûr de vouloir vider tout le panier ?");
    if (confirmed) {
      setCartItems([]);
      localStorage.removeItem("cart"); // ❌ vide localStorage
    }
  };

  const totalPrix = cartItems.reduce((acc, item) => {
    const prix = parsePrix(item.prix);
    return acc + prix * (item.quantité || 1);
  }, 0);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Votre Panier</h1>

      {cartItems.length === 0 ? (
        <p>Le panier est vide.</p>
      ) : (
        <div>
          <ul>
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

          <button
            onClick={handleClearCart}
            style={{
              marginTop: '1rem',
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
        </div>
      )}
    </div>
  );
};

// Convertit "5 000 FCFA" en 5000
function parsePrix(prix: string): number {
  return parseInt(prix.replace(/[^\d]/g, ""), 10);
}

// Convertit 5000 en "5 000 FCFA"
function formatPrix(valeur: number): string {
  return valeur.toLocaleString('fr-FR') + ' FCFA';
}

// Style pour les boutons + et -
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
