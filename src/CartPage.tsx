import React, { useState } from "react"; 
import type { MenuItem } from "./types";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { images } from "./firebaseImages";

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  localisation: string | null;
};

const CartPage: React.FC<Props> = ({ cartItems, setCartItems, localisation }) => {
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // Récupère le prix réel d'un item (string ou tableau)
  const getPrixString = (item: MenuItem) => {
    if (typeof item.prix === "string") return item.prix;
    if (Array.isArray(item.prix)) {
      const selected = item.prix.find(p => p.selected) || item.prix[0];
      return selected.value;
    }
    return "";
  };

  const getPrixLabel = (item: MenuItem) => {
    if (typeof item.prix === "string") return item.prix;
    if (Array.isArray(item.prix)) {
      const selected = item.prix.find(p => p.selected) || item.prix[0];
      return selected.label;
    }
    return "";
  };

  // Mettre à jour la quantité
  const updateQuantity = (item: MenuItem, delta: number) => {
    setCartItems(prev =>
      prev
        .map(i =>
          i.id === item.id && getPrixString(i) === getPrixString(item)
            ? { ...i, quantité: (i.quantité || 1) + delta }
            : i
        )
        .filter(i => (i.quantité || 1) > 0)
    );
  };

  // Supprimer un item avec fade-out
  const handleRemoveItem = (item: MenuItem) => {
    const uniqueId = `${item.id}-${getPrixString(item)}`;
    setRemovingItemId(uniqueId);

    setTimeout(() => {
      setCartItems(prev =>
        prev.filter(i => !(i.id === item.id && getPrixString(i) === getPrixString(item)))
      );
      setRemovingItemId(null);
    }, 300);
  };

  // Vider le panier
  const handleClearCart = () => {
    if (window.confirm("Es-tu sûr de vouloir vider tout le panier ?")) {
      setCartItems([]);
      localStorage.removeItem("cart");
    }
  };

  // Calcul du total
  const totalPrix = cartItems.reduce(
    (acc, item) => acc + parsePrix(getPrixString(item)) * (item.quantité || 1),
    0
  );

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
          .map(item => `- ${item.nom} x${item.quantité} (${getPrixLabel(item)})`)
          .join("\n") +
        `\n\nTotal: ${formatPrix(totalPrix)}` +
        `\nLocalisation : ${localisation || "Non spécifiée"}` +
        `\nNom : ${nom}\nPrénom : ${prenom}`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="cartContent" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h1 className="hcart">Votre Panier</h1>

      {cartItems.length === 0 ? (
        <p>Le panier est vide.</p>
      ) : (
        <>
          <ul className="itemList">
            {cartItems.map(item => {
              const uniqueId = `${item.id}-${getPrixString(item)}`;
              const isRemoving = removingItemId === uniqueId;

              return (
                <li
                  key={uniqueId}
                  className={`list ${isRemoving ? "fade-out" : ""}`}
                  style={{
                    marginBottom: "1rem",
                    transition: "opacity 0.3s, transform 0.3s",
                    opacity: isRemoving ? 0 : 1,
                    transform: isRemoving ? "translateX(50px)" : "translateX(0)",
                  }}
                >
                  <div className="itemName">
                    <strong>{item.nom}</strong> {getPrixLabel(item)} × {item.quantité} ={" "}
                    {formatPrix(parsePrix(getPrixString(item)) * (item.quantité || 1))}
                  </div>
                  <div
                    className="divQuant"
                    style={{
                      marginTop: "1.5rem",
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <button className="reduce" onClick={() => updateQuantity(item, -1)}>-</button>
                    <span>{item.quantité}</span>
                    <button className="adds" onClick={() => updateQuantity(item, 1)}>+</button>
                    <button className="delete-item" onClick={() => handleRemoveItem(item)}>
                      <img src={images.trash} alt="" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <h2 className="price">Total : {formatPrix(totalPrix)}</h2>

          <div className="form">
            <h2 className="info">Informations Client</h2>
            <div className="inputs">
              <input
                type="text"
                placeholder="Nom"
                value={nom}
                onChange={e => setNom(e.target.value)}
              />
              <input
                type="text"
                placeholder="Prénom"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
              />
            </div>
          </div>

          <div className="CartBtns" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
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
