import React, { useState } from "react";
import type { MenuItem } from "./types";
import { useNavigate } from "react-router-dom";
import "./App.css";

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  localisation: string | null; // table, chambre ou HP03
};

const CartPage: React.FC<Props> = ({ cartItems, setCartItems, localisation }) => {
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");

  // Mettre à jour la quantité
  const updateQuantity = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantité: (item.quantité || 1) + delta }
            : item
        )
        .filter((item) => (item.quantité || 1) > 0)
    );
  };

  // Vider le panier
  const handleClearCart = () => {
    if (window.confirm("Es-tu sûr de vouloir vider tout le panier ?")) {
      setCartItems([]);
      localStorage.removeItem("cart");
    }
  };

  // Calcul du total
  const totalPrix = cartItems.reduce((acc, item) => {
    const prix = parsePrix(item.prix);
    return acc + prix * (item.quantité || 1);
  }, 0);

  // Commander via WhatsApp
  const handleCommander = () => {
    if (cartItems.length === 0) {
      alert("Ton panier est vide.");
      return;
    }

    const phoneNumber = "237657011948";
    const message = encodeURIComponent(
      `Bonjour, j'aimerais commander les articles suivants :\n\n` +
        cartItems
          .map(
            (item) =>
              `- ${item.nom} x${item.quantité} (${item.prix})`
          )
          .join("\n") +
        `\n\nTotal: ${formatPrix(totalPrix)}` +
        `\nLocalisation : ${localisation || "Non spécifiée"}` +
        `\nNom : ${nom}\nPrénom : ${prenom}`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="cartContent" style={{ maxWidth: "600px", margin: "0 auto" }}>
      {/* Bouton retour
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "10px",
          padding: "8px 12px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        ← Retour
      </button> */}

      <h1 className="hcart">Votre Panier</h1>

      {cartItems.length === 0 ? (
        <p>Le panier est vide.</p>
      ) : (
        <>
          <ul className="itemList">
            {cartItems.map((item) => (
              <li className="list" key={item.id} style={{ marginBottom: "1rem" }}>
                <div className="itemName">
                  <strong>{item.nom}</strong> {item.prix} × {item.quantité} ={" "}
                  {formatPrix((item.quantité || 1) * parsePrix(item.prix))}
                </div>
                <div className="divQuant" style={{ marginTop: "1.5rem" }}>
                  <button
                    className="reduce"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    -
                  </button>
                  <span style={{ margin: "0 1rem" }}>{item.quantité}</span>
                  <button
                    className="adds"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <hr />
          <h2 className="price">Total : {formatPrix(totalPrix)}</h2>

          {/* Formulaire client */}
          <div className="form">
            <h2 className="info">Informations Client</h2>
            <div className="inputs">
              <input
                type="text"
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
              <input
                type="text"
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
          </div>

          {/* Boutons actions */}
          <div
            className="CartBtns"
            style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}
          >
            <button
              onClick={handleClearCart}
              style={{
                backgroundColor: "white",
                color: "#7d3837",
                padding: "0.7rem 1.2rem",
                border: "2px solid #7d3837",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Vider le panier
            </button>
            <button
              onClick={handleCommander}
              style={{
                backgroundColor: "#7d3837",
                color: "white",
                padding: "0.7rem 1.2rem",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Commander
            </button>
          </div>
        </>
      )}
    </div>
  );
};

function parsePrix(prix: string): number {
  return parseInt(prix.replace(/[^\d]/g, ""), 10);
}

function formatPrix(valeur: number): string {
  return valeur.toLocaleString("fr-FR") + " FCFA";
}

export default CartPage;
