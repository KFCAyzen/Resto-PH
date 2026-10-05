import React, { useState, useEffect } from "react";
import type { MenuItem } from "../types";

import { collection, addDoc, serverTimestamp, query, where, onSnapshot, documentId } from "firebase/firestore";
import { db } from "../firebase";
import "../CartPage.css";
import { images } from "../imagesFallback";
import { type Commande, formatDate, formatFCFA, parsePrix, statutColor, statutLabel } from "../lib/commandes";
import { cleCommande, formatPrixTexte, prixUnitaire } from "../lib/menu";

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  localisation: string | null;
  onBrowseMenu: () => void;
};

const WHATSAPP_NUMBER = "237657011948";
const CLIENT_KEY = "client";
const ORDERS_KEY = "mesCommandes";
const MAX_SUIVI = 10;

function lireStockage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function ecrireStockage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage indisponible : on ignore
  }
}

// addDoc ne se résout jamais hors ligne : on n'attend pas indéfiniment avant d'ouvrir WhatsApp
function avecDelai<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

const CartPage: React.FC<Props> = ({ cartItems, setCartItems, localisation, onBrowseMenu }) => {
  const [nom, setNom] = useState(() => lireStockage(CLIENT_KEY, { nom: "", prenom: "" }).nom);
  const [prenom, setPrenom] = useState(() => lireStockage(CLIENT_KEY, { nom: "", prenom: "" }).prenom);
  const [lieu, setLieu] = useState("");
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [mesCommandeIds, setMesCommandeIds] = useState<string[]>(() => lireStockage<string[]>(ORDERS_KEY, []));
  const [mesCommandes, setMesCommandes] = useState<Commande[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: "success" | "error" } | null>(null);

  useEffect(() => {
    ecrireStockage(CLIENT_KEY, { nom, prenom });
  }, [nom, prenom]);

  // Suivi en temps réel des commandes passées depuis cet appareil
  useEffect(() => {
    if (mesCommandeIds.length === 0) {
      setMesCommandes([]);
      return;
    }
    const q = query(collection(db, "commandes"), where(documentId(), "in", mesCommandeIds));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const commandes = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Commande)
          .filter(cmd => cmd.statut !== "livree")
          .sort((a, b) => (b.dateCommande?.toMillis() ?? Date.now()) - (a.dateCommande?.toMillis() ?? Date.now()));
        setMesCommandes(commandes);
      },
      err => console.error("Suivi des commandes indisponible:", err)
    );
    return () => unsubscribe();
  }, [mesCommandeIds]);

  const localisationFinale = localisation || lieu.trim() || "Non spécifiée";

  const updateQuantity = (item: MenuItem, delta: number) => {
    const quantite = (item.quantité ?? 1) + delta;
    if (quantite < 1) {
      handleRemoveItem(item);
      return;
    }
    setCartItems(prev =>
      prev.map(i => (cleCommande(i) === cleCommande(item) ? { ...i, quantité: quantite } : i))
    );
  };

  // Supprimer un item avec fade-out
  const handleRemoveItem = (item: MenuItem) => {
    const uniqueId = cleCommande(item);
    setRemovingItemId(uniqueId);
    setTimeout(() => {
      setCartItems(prev => prev.filter(i => cleCommande(i) !== uniqueId));
      setRemovingItemId(null);
    }, 300);
  };

  const handleClearCart = () => {
    if (window.confirm("Voulez-vous vraiment vider le panier ?")) {
      setCartItems([]);
    }
  };

  const totalPrix = cartItems.reduce(
    (acc, item) => acc + parsePrix(prixUnitaire(item)) * (item.quantité ?? 1),
    0
  );

  const libellePrix = (item: MenuItem) => formatPrixTexte(prixUnitaire(item)) || "prix sur demande";

  const messageWhatsApp = () =>
    `Bonjour, j'aimerais commander les articles suivants :\n\n` +
    cartItems.map(item => `- ${item.nom} x${item.quantité ?? 1} (${libellePrix(item)})`).join("\n") +
    `\n\nTotal : ${formatFCFA(totalPrix)}` +
    `\nLocalisation : ${localisationFinale}` +
    `\nNom : ${nom.trim()}\nPrénom : ${prenom.trim()}`;

  // Enregistrer la commande dans Firestore puis l'envoyer via WhatsApp
  const handleCommander = async () => {
    if (submitting || cartItems.length === 0) return;
    if (!nom.trim() || !prenom.trim()) {
      setMessage({ text: "Veuillez renseigner votre nom et votre prénom.", kind: "error" });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageWhatsApp())}`;
    // L'onglet est ouvert pendant le clic : ouvert après l'enregistrement, il serait bloqué sur mobile
    const waWindow = window.open("", "_blank");

    let enregistree = false;
    try {
      const ref = await avecDelai(
        addDoc(collection(db, "commandes"), {
          items: cartItems.map(item => ({
            nom: String(item.nom || ""),
            prix: String(prixUnitaire(item) || ""),
            quantité: Number(item.quantité ?? 1),
          })),
          total: Number(totalPrix || 0),
          clientNom: nom.trim(),
          clientPrenom: prenom.trim(),
          localisation: localisationFinale,
          dateCommande: serverTimestamp(),
          statut: "en_attente",
        }),
        8000
      );
      const ids = [...mesCommandeIds.filter(id => id !== ref.id), ref.id].slice(-MAX_SUIVI);
      setMesCommandeIds(ids);
      ecrireStockage(ORDERS_KEY, ids);
      enregistree = true;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la commande:", error);
    }

    if (waWindow) {
      waWindow.opener = null;
      waWindow.location.href = waUrl;
    } else {
      window.location.href = waUrl;
    }

    if (enregistree) {
      setCartItems([]);
      setMessage({ text: "Commande enregistrée ! Envoyez le message WhatsApp pour la confirmer.", kind: "success" });
    } else {
      setMessage({
        text: "La commande n'a pas pu être enregistrée en ligne. Envoyez-la via WhatsApp qui vient de s'ouvrir.",
        kind: "error",
      });
    }
    setSubmitting(false);
  };

  // Affiché près des boutons tant que le panier est rempli, sinon en haut de page
  const messageElement = message && (
    <div className={`cart-message ${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>
      {message.text}
    </div>
  );

  return (
    <div className="cart-container">
      <h1 className="cart-title">Votre Panier</h1>

      {cartItems.length === 0 && messageElement}

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Votre panier est vide</p>
          <button type="button" className="btn btn-secondary" onClick={onBrowseMenu}>
            Voir le menu
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => {
              const uniqueId = cleCommande(item);
              const isRemoving = removingItemId === uniqueId;
              const quantite = item.quantité ?? 1;

              return (
                <div key={uniqueId} className={`cart-item ${isRemoving ? "fade-out" : ""}`}>
                  <div className="cart-item-header">
                    <div className="cart-item-info">
                      <h3>{item.nom}</h3>
                      <div className="cart-item-price">
                        {libellePrix(item)} × {quantite}
                      </div>
                    </div>
                    <div className="cart-item-total">
                      {formatFCFA(parsePrix(prixUnitaire(item)) * quantite)}
                    </div>
                  </div>

                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() => updateQuantity(item, -1)}
                        aria-label={quantite === 1 ? `Retirer ${item.nom}` : `Diminuer la quantité de ${item.nom}`}
                      >
                        −
                      </button>
                      <span className="quantity-display" aria-live="polite">{quantite}</span>
                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() => updateQuantity(item, 1)}
                        aria-label={`Augmenter la quantité de ${item.nom}`}
                      >
                        +
                      </button>
                    </div>
                    <button type="button" className="cart-remove-btn" onClick={() => handleRemoveItem(item)} aria-label={`Supprimer ${item.nom}`}>
                      <img src={images.trash} alt="" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-total">
            <h2>Total : {formatFCFA(totalPrix)}</h2>
          </div>

          <div className="client-form">
            <h3>Informations Client</h3>
            <div className="form-inputs">
              <input
                type="text"
                placeholder="Nom"
                aria-label="Nom"
                autoComplete="family-name"
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Prénom"
                aria-label="Prénom"
                autoComplete="given-name"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                className="form-input"
              />
              {localisation ? (
                <p className="cart-location">Localisation : <strong>{localisation}</strong></p>
              ) : (
                <input
                  type="text"
                  placeholder="Table ou chambre (facultatif)"
                  aria-label="Table ou chambre"
                  value={lieu}
                  onChange={e => setLieu(e.target.value)}
                  className="form-input form-input-full"
                />
              )}
            </div>
          </div>

          {messageElement}

          <div className="cart-actions">
            <button type="button" onClick={handleClearCart} className="btn btn-secondary" disabled={submitting}>
              Vider le panier
            </button>
            <button type="button" onClick={handleCommander} className="btn btn-primary" disabled={submitting}>
              {submitting ? "Envoi..." : "Commander via WhatsApp"}
            </button>
          </div>
        </>
      )}

      {/* Commandes passées depuis cet appareil */}
      {mesCommandes.length > 0 && (
        <div className="orders-section">
          <h3 className="orders-title">Mes commandes en cours</h3>
          <div className="orders-list">
            {mesCommandes.map(commande => (
              <div key={commande.id} className="order-card">
                <div className="order-header">
                  <span className="order-date">{formatDate(commande.dateCommande)}</span>
                  <span className="order-status" style={{ backgroundColor: statutColor(commande.statut) }}>
                    {statutLabel(commande.statut)}
                  </span>
                </div>
                <div className="order-total">Total : {formatFCFA(commande.total)}</div>
                <div className="order-details">
                  {commande.items.length} article(s) • {commande.localisation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
