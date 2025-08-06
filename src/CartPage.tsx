import React, { useEffect, useState } from 'react';
import type { MenuItem } from './types';

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
};

const CartPage: React.FC<Props> = ({ cartItems, setCartItems }) => {
  const [table, setTable] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get("table");
    setTable(tableParam);
  }, []);

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
      localStorage.removeItem('cart');
    }
  };

  const handleCommander = () => {
    const confirmed = window.confirm("Confirmer la commande ?");
    if (!confirmed) return;

    const commandeText = cartItems.map(item =>
      `- ${item.nom} x ${item.quantité} = ${formatPrix(parsePrix(item.prix) * (item.quantité || 1))}`
    ).join("\n");

    const total = formatPrix(cartItems.reduce((acc, item) => {
      const prix = parsePrix(item.prix);
      return acc + prix * (item.quantité || 1);
    }, 0));

    const tableInfo = table ? `\nTable : ${table}` : "\nTable : Non précisée";

    const message = encodeURIComponent(
      `Bonjour,\nJ’aimerais commander les articles suivants :\n\n${commandeText}\n\nTotal : ${total}${tableInfo}`
    );

    const numeroWhatsApp = "237657011948"; // à adapter
    const url = `https://wa.me/${numeroWhatsApp}?text=${message}`;
    window.open(url, "_blank");
  };

  const totalPrix = cartItems.reduce((acc, item) => {
    const prix = parsePrix(item.prix);
    return acc + prix * (item.quantité || 1);
  }, 0);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Votre Panier</h1>

      {table && (
        <p style={{ fontWeight: 'bold' }}>Table n°{table}</p>
      )}

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

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={handleCommander}
              style={{
                backgroundColor: '#2980b9',
                color: 'white',
                padding: '0.7rem 1.2rem',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              Commander
            </button>

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
          </div>
        </div>
      )}
    </div>
  );
};

// change 5000 FCFA en 5000
function parsePrix(prix: string): number {
  return parseInt(prix.replace(/[^\d]/g, ""), 10);
}

// change 5000 en 5000 FCFA
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
