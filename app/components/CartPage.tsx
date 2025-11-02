import React, { useState, useEffect } from "react"; 
import type { MenuItem } from "../types";

import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import "../CartPage.css";
import { images } from "../imagesFallback";

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  localisation: string | null;
};

const CartPage: React.FC<Props> = ({ cartItems, setCartItems, localisation }) => {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [mesCommandes, setMesCommandes] = useState<any[]>([]);
  const [showCommandes, setShowCommandes] = useState(false);

  // Écouter les commandes du client
  useEffect(() => {
    if (nom.trim() && prenom.trim()) {
      const q = query(
        collection(db, 'commandes'),
        where('clientNom', '==', nom.trim()),
        where('clientPrenom', '==', prenom.trim())
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commandes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        // Filtrer pour ne garder que les commandes non livrées et trier par date
        const commandesNonLivrees = commandes
          .filter(cmd => cmd.statut !== 'livree')
          .sort((a, b) => {
            if (!a.dateCommande || !b.dateCommande) return 0;
            return b.dateCommande.toMillis() - a.dateCommande.toMillis();
          });
        setMesCommandes(commandesNonLivrees);
        
        // Afficher la section si il y a des commandes non livrées
        if (commandesNonLivrees.length > 0) {
          setShowCommandes(true);
        }
      });
      
      return () => unsubscribe();
    } else {
      setMesCommandes([]);
    }
  }, [nom, prenom]);

  // Récupère le prix réel d'un item (string ou tableau)
  const getPrixString = (item: MenuItem) => {
    if (typeof item.prix === "string") return item.prix || "0 FCFA";
    if (Array.isArray(item.prix)) {
      const selected = item.prix.find(p => p.selected) || item.prix[0];
      return selected.value || "0 FCFA";
    }
    return "0 FCFA";
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

  // Commander via WhatsApp et sauvegarder dans Firebase
  const handleCommander = async () => {
    if (cartItems.length === 0) {
      alert("Ton panier est vide.");
      return;
    }

    if (!nom.trim() || !prenom.trim()) {
      alert("Veuillez remplir votre nom et prénom.");
      return;
    }

    try {
      // Sauvegarder la commande dans Firebase
      const commandeData = {
        items: cartItems.map(item => ({
          nom: String(item.nom || ''),
          prix: String(getPrixString(item) || ''),
          quantité: Number(item.quantité || 1)
        })),
        total: Number(totalPrix || 0),
        clientNom: String(nom.trim()),
        clientPrenom: String(prenom.trim()),
        localisation: String(localisation || "Non spécifiée"),
        dateCommande: serverTimestamp(),
        statut: String('en_attente')
      };

      await addDoc(collection(db, 'commandes'), commandeData);
      
      // Activer l'affichage des commandes après la première commande
      setShowCommandes(true);

      // Envoyer via WhatsApp
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
      
      // Vider le panier après commande
      setCartItems([]);
      localStorage.removeItem("cart");
      // Ne pas vider nom/prénom pour permettre le suivi des commandes
      
      alert("Commande envoyée avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la commande:", error);
      alert("Erreur lors de l'enregistrement. La commande WhatsApp va quand même s'ouvrir.");
      
      // Envoyer quand même via WhatsApp en cas d'erreur Firebase
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
    }
  };

  const getStatutColor = (statut: string): string => {
    switch (statut) {
      case 'en_attente': return '#ff9800';
      case 'en_preparation': return '#2196f3';
      case 'prete': return '#4caf50';
      case 'livree': return '#9e9e9e';
      default: return '#757575';
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString('fr-FR');
  };

  return (
    <div className="cart-container">
      <h1 className="cart-title">Votre Panier</h1>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Votre panier est vide</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => {
              const uniqueId = `${item.id}-${getPrixString(item)}`;
              const isRemoving = removingItemId === uniqueId;

              return (
                <div
                  key={uniqueId}
                  className={`cart-item ${isRemoving ? "fade-out" : ""}`}
                >
                  <div className="cart-item-header">
                    <div className="cart-item-info">
                      <h3>{item.nom}</h3>
                      <div className="cart-item-price">
                        {getPrixLabel(item)} × {item.quantité}
                      </div>
                    </div>
                    <div className="cart-item-total">
                      {formatPrix(parsePrix(getPrixString(item)) * (item.quantité || 1))}
                    </div>
                  </div>
                  
                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button className="quantity-btn" onClick={() => updateQuantity(item, -1)}>-</button>
                      <span className="quantity-display">{item.quantité}</span>
                      <button className="quantity-btn" onClick={() => updateQuantity(item, 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => handleRemoveItem(item)}>
                      <img src={images.trash} alt="Supprimer" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-total">
            <h2>Total : {formatPrix(totalPrix)}</h2>
          </div>

          <div className="client-form">
            <h3>Informations Client</h3>
            <div className="form-inputs">
              <input
                type="text"
                placeholder="Nom"
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Prénom"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="cart-actions">
            <button onClick={handleClearCart} className="btn btn-secondary">
              Vider le panier
            </button>
            <button onClick={handleCommander} className="btn btn-primary">
              Commander
            </button>
          </div>
        </>
      )}
      
      {/* Affichage des commandes du client */}
      {nom.trim() && prenom.trim() && (
        <div className="orders-section">
          <h3 className="orders-title">Mes Commandes en cours</h3>
          {mesCommandes.length === 0 ? (
            <p className="orders-empty">Aucune commande en cours pour {prenom} {nom}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mesCommandes.map((commande) => (
                <div key={commande.id} className="order-card">
                  <div className="order-header">
                    <span className="order-date">
                      {formatDate(commande.dateCommande)}
                    </span>
                    <span 
                      className="order-status"
                      style={{ backgroundColor: getStatutColor(commande.statut) }}
                    >
                      {commande.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="order-total">
                    Total: {formatPrix(commande.total)}
                  </div>
                  <div className="order-details">
                    {commande.items.length} article(s) • {commande.localisation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function parsePrix(prix: string): number {
  if (!prix || prix.trim() === "") return 0;
  const parsed = parseInt(prix.replace(/[^\d]/g, ""), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function formatPrix(valeur: number): string {
  return valeur.toLocaleString("fr-FR") + " FCFA";
}

export default CartPage;
