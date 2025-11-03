import { useState } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, doc, deleteDoc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { uploadImageFromBrowser } from "../upLoadFirebase";
import type { MenuItem } from "../types";
import { useRealtimeCollection } from "../hooks/useRealtimeCollection"; // Hook temps réel
import "../AdminPage.css";
import { menuItems, drinksItems } from "../types";
import { images } from "../imagesFallback";
import { useEffect } from "react";

interface Commande {
  id: string;
  items: Array<{
    nom: string;
    prix: string;
    quantité: number;
  }>;
  total: number;
  clientNom: string;
  clientPrenom: string;
  localisation: string;
  dateCommande: Timestamp;
  statut: 'en_attente' | 'en_preparation' | 'prete' | 'livree';
}
// Convertir une URL Firebase Storage → chemin interne utilisable par ref()
function getStoragePathFromUrl(url: string) {
  const match = url.match(/o\/(.*?)\?alt=media/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function AdminPage() {
  type PriceOption = { label: string; value: string; selected?: boolean };
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState<PriceOption[]>([]);
  const [categorie, setCategorie] = useState<"plats" | "boissons" | "desserts" | string>("plats");
  const [filtre, setFiltre] = useState<string>(""); // Nouveau champ filtre obligatoire
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<"Plats" | "Boissons" | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'menu' | 'commandes'>('menu');
  const [commandes, setCommandes] = useState<Commande[]>([]);

  // --- Récupération temps réel des collections ---
  const { items: plats } = useRealtimeCollection("Plats");
  const { items: boissons } = useRealtimeCollection("Boissons");
  const [loading, setLoading] = useState(true);

  // Fonction pour supprimer et re-uploader tous les items avec le champ masque
  const resetAndReuploadItems = async () => {
    if (!window.confirm('Supprimer et re-uploader tous les items ? Cette action est irréversible.')) return;
    
    try {
      // Supprimer toutes les collections
      const collections = ['Plats', 'Boissons'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        for (const docSnapshot of snapshot.docs) {
          await deleteDoc(doc(db, collectionName, docSnapshot.id));
        }
      }
      
      // Re-uploader les items avec le champ masque
      for (const item of menuItems) {
        await addDoc(collection(db, 'Plats'), {
          ...item,
          masque: false
        });
      }
      
      for (const item of drinksItems) {
        await addDoc(collection(db, 'Boissons'), {
          ...item,
          masque: false
        });
      }
      
      alert('Tous les items ont été re-uploadés avec succès !');
    } catch (error) {
      console.error('Erreur lors du reset:', error);
      alert('Erreur lors du reset');
    }
  };

  // Migration: ajouter le champ masque aux items existants
  const migrateExistingItems = async () => {
    try {
      const collections = ['Plats', 'Boissons'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          if (data.masque === undefined) {
            await updateDoc(doc(db, collectionName, docSnapshot.id), {
              masque: false
            });
          }
        }
      }
      
      console.log('Migration terminée: champ masque ajouté aux items existants');
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
    }
  };

  // Simuler chargement et effectuer la migration
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      migrateExistingItems();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Récupération temps réel des commandes
  useEffect(() => {
    const q = query(collection(db, 'commandes'), orderBy('dateCommande', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commandesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commande[];
      
      setCommandes(commandesData);
    });

    return () => unsubscribe();
  }, []);

  /* Upload fichier */
  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageFromBrowser(file, filtre || "general");
      setImageUrl(url);
    } catch {
      setError("Erreur lors de l’upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  /* Gestion des options de prix */
  const addPriceOption = () => setPrix([...prix, { label: "", value: "" }]);
  const updatePriceOption = (index: number, field: "label" | "value", val: string) => {
    const updated = [...prix];
    updated[index][field] = val;
    setPrix(updated);
  };
  const removePriceOption = (index: number) => setPrix(prix.filter((_, i) => i !== index));

  /* Soumission Firestore */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validations
    if (!imageUrl) return alert("Merci d’ajouter une image !");
    // Validations de base
    if (!imageUrl) return alert("Merci d'ajouter une image !");
    if (!nom.trim()) return alert("Merci de renseigner un nom !");
    if (prix.length === 0) return alert("Ajoutez au moins une option de prix !");
    if (prix.some(p => !p.value.trim())) return alert("Chaque option de prix doit avoir une valeur.");
    if (prix.length >= 2 && prix.some(p => !p.label.trim())) return alert("Le label est obligatoire quand il y a plusieurs prix.");
    if (!categorie.trim()) return alert("Merci de renseigner une catégorie !");
    if (!filtre.trim()) return alert("Merci de renseigner un filtre !");

    try {
      // Auto-détection des boissons basée sur le filtre/catégorie
      const drinkKeywords = ['guinness', 'bière', 'vin', 'whisky', 'vodka', 'champagne', 'cocktail', 'jus', 'soda', 'boisson'];
      const isAutoDetectedDrink = drinkKeywords.some(keyword => 
        filtre.toLowerCase().includes(keyword) || nom.toLowerCase().includes(keyword)
      );
      
      const collectionName: "Plats" | "Boissons" = editId 
        ? (editingCollection as any) 
        : (categorie === "boissons" || isAutoDetectedDrink ? "Boissons" : "Plats");
      
      // Validation spécifique à la collection
      if (collectionName === "Plats" && !description.trim()) {
        return alert("Merci de renseigner une description pour les plats !");
      }

      // Si une seule option avec label vide → stocker juste la valeur
      const prixField: string | PriceOption[] =
        prix.length === 1 && prix[0].label === "" ? prix[0].value : prix;

      if (editId) {
        await setDoc(
          doc(db, collectionName, editId),
          {
            nom,
            description,
            prix: prixField,
            catégorie: [filtre],
            filtre: [filtre], // Enregistrement du filtre comme tableau
            image: imageUrl,
            masque: false, // Assurer que le champ masque existe
          },
          { merge: true }
        );
      } else {
        await addDoc(collection(db, collectionName), {
          nom,
          description,
          prix: prixField,
          catégorie: [filtre],
          filtre: [filtre], // Enregistrement du filtre comme tableau
          image: imageUrl,
          masque: false, // Nouveau champ pour tous les nouveaux items
        });
      }

      alert(editId ? "Item modifié avec succès !" : "Item ajouté avec succès !");
      // reset formulaire
      setNom("");
      setDescription("");
      setPrix([]);
      setCategorie("plats");
      setFiltre(""); // Reset filtre
      setImageUrl("");
      setEditId(null);
      setEditingCollection(null);
    } catch (err) {
      console.error(err);
      alert(editId ? "Erreur lors de la modification" : "Erreur lors de l’ajout");
    }
  };

  /* Suppression Firestore + Storage */
  const handleDelete = async (collectionName: "Plats" | "Boissons", id: string) => {
    if (!window.confirm("Supprimer cet item ?")) return;
    try {
      const itemDoc = await getDoc(doc(db, collectionName, id));
      if (itemDoc.exists()) {
        const data = itemDoc.data();
        if (data.image) {
          const path = getStoragePathFromUrl(data.image);
          if (path) await deleteObject(ref(storage, path));
        }
      }
      await deleteDoc(doc(db, collectionName, id));
      alert("Item supprimé !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const formatPrix = (item: MenuItem) =>
    typeof item.prix === "string"
      ? item.prix
      : item.prix.map(p => `${p.label ? p.label + " - " : ""}${p.value}`).join(", ");

  // Fonction pour masquer/afficher un item
  const toggleItemVisibility = async (collectionName: "Plats" | "Boissons", id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        masque: !currentStatus
      });
      alert(`Item ${!currentStatus ? 'masqué' : 'affiché'} avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  // Gestion des commandes
  const updateCommandeStatut = async (commandeId: string, nouveauStatut: string) => {
    try {
      await updateDoc(doc(db, 'commandes', commandeId), {
        statut: nouveauStatut
      });
      alert('Statut mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const deleteCommande = async (commandeId: string) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    try {
      await deleteDoc(doc(db, 'commandes', commandeId));
      alert('Commande supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const formatDate = (timestamp: Timestamp): string => {
    return timestamp.toDate().toLocaleString('fr-FR');
  };

  const formatPrixCommande = (valeur: number): string => {
    return valeur.toLocaleString('fr-FR') + ' FCFA';
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

  if (loading) {
    return (
      <div className="admin-skeleton">
        <div className="skeleton-text" style={{ height: '32px', width: '300px', margin: '0 auto 2rem' }}></div>
        
        {/* Onglets skeleton */}
        <div className="admin-skeleton-tabs">
          <div className="admin-skeleton-tab"></div>
          <div className="admin-skeleton-tab"></div>
          <div className="admin-skeleton-tab"></div>
        </div>
        
        {/* Formulaire skeleton */}
        <div className="admin-skeleton-form">
          <div className="admin-skeleton-input"></div>
          <div className="admin-skeleton-textarea"></div>
          <div className="admin-skeleton-input"></div>
          <div className="admin-skeleton-input"></div>
        </div>
        
        {/* Liste items skeleton */}
        <div className="admin-skeleton-items">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="admin-skeleton-item">
              <div className="admin-skeleton-item-img"></div>
              <div className="admin-skeleton-item-content">
                <div className="admin-skeleton-item-text"></div>
                <div className="admin-skeleton-item-text short"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>Back Office - Administration</h1>
      
      {/* Onglets */}
      <div className="admin-tabs">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`admin-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <img src={activeTab === 'menu' ? images.gestionActif : images.gestion} alt="gestion" style={{ height: '20px' }} />
          <span>Gestion du Menu</span>
        </button>
        <button 
          onClick={() => setActiveTab('commandes')}
          className={`admin-tab-btn ${activeTab === 'commandes' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <img src={activeTab === 'commandes' ? images.commandesActif : images.commandes} alt="commandes" style={{ height: '20px' }} />
          <span>Commandes ({commandes.filter(c => c.statut !== 'livree').length})</span>
        </button>
        <a href="/historique" className="admin-tab-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={images.historique} alt="historique" style={{ height: '20px' }} />
          <span>Historique</span>
        </a>
      </div>

      {/* Contenu de l'onglet Menu */}
      {activeTab === 'menu' && (
        <>
          {/* Formulaire ajout item */}
          <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Nom"
            value={nom}
            onChange={e => setNom(e.target.value)}
            required
            className="form-input"
          />
        </div>
        
        <div className="form-row">
          <textarea
            placeholder={categorie === "boissons" ? "Description (optionnel)" : "Description"}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            required={categorie !== "boissons"}
            className="form-textarea"
          />
        </div>

        <div className="price-options-section">
          <p className="section-title">
            <strong>Prix :</strong>
          </p>
          {prix.map((opt, idx) => (
            <div key={idx} className="price-option">
              <input
                type="text"
                placeholder={prix.length >= 2 ? "Label (obligatoire)" : "Label (facultatif)"}
                value={opt.label || ""}
                onChange={e => updatePriceOption(idx, "label", e.target.value)}
                className="price-input"
                required={prix.length >= 2}
              />
              <input
                type="text"
                placeholder="Valeur"
                value={opt.value || ""}
                onChange={e => updatePriceOption(idx, "value", e.target.value)}
                className="price-input"
              />
              <button type="button" onClick={() => removePriceOption(idx)} className="remove-btn">
                <img src={images.cross} alt="cross" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addPriceOption} className="add-price-btn">
            Ajouter une option de prix
          </button>
        </div>

        <div className="form-row-group">
          {/* Collection (pour routage uniquement) */}
          <div className="form-field">
            <label className="field-label">
              <strong>Collection :</strong>
            </label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} className="form-select">
              <option value="plats">Plats</option>
              <option value="boissons">Boissons</option>
            </select>
          </div>

          {/* Filtre (pour organisation et affichage) */}
          <div className="form-field">
            <label className="field-label">
              <strong>Catégorie/Filtre :</strong>
            </label>
            <input
              type="text"
              placeholder="Ex : Entrées, Plats principaux, Desserts..."
              value={filtre}
              onChange={e => setFiltre(e.target.value)}
              required
              className="form-input"
            />
          </div>
        </div>

        <div
          className={`drop-zone ${uploading ? "active" : ""}`}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          {uploading ? "Upload en cours..." : "Glissez-déposez une image ou cliquez"}
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </div>

        {imageUrl && (
          <div className="preview">
            <img src={imageUrl} alt="Aperçu" className="item-img" />
          </div>
        )}
        {error && <p style={{ color: "#e53935" }}>{error}</p>}

        <button type="submit" disabled={uploading}>
          {uploading ? "Upload..." : "Ajouter"}
        </button>
      </form>

      {/* Barre de recherche */}
      <div className="search-section" style={{ marginBottom: '20px' }}>
        <input
          type="search"
          placeholder="Rechercher un item..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button
          onClick={migrateExistingItems}
          style={{
            marginLeft: '10px',
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Mettre à jour les items
        </button>
        <button
          onClick={resetAndReuploadItems}
          style={{
            marginLeft: '10px',
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset & Re-upload
        </button>
      </div>

      {/* Liste items (uniquement contenu stocké dans Firestore) */}
      <h2>Plats</h2>
      <ul className="item-list">
        {plats.filter(item => 
          item.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.filtre?.[0]?.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(item => (
          <li key={item.id} className="item-card">
            {item.image && <img src={item.image} alt={item.nom} className="item-img" />}
            <div className="item-info">
              <b>{item.nom}</b> - {formatPrix(item)} <br />
              <i>Catégorie: {item.filtre?.[0]}</i>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="edit-btn"
                onClick={() => {
                  setEditId(String(item.id));
                  setEditingCollection("Plats");
                  setNom(item.nom || "");
                  setDescription(item.description || "");
                  if (typeof item.prix === "string") setPrix([{ label: "", value: item.prix }]);
                  else setPrix(item.prix as PriceOption[]);
                  setCategorie(item.catégorie?.[0] || "plats");
                  setFiltre(item.filtre?.[0] || ""); // Charger le filtre
                  setImageUrl(item.image || "");
                }}
              >
                Modifier
              </button>
              <button
                className={item.masque ? "show-btn" : "hide-btn"}
                onClick={() => toggleItemVisibility("Plats", String(item.id), item.masque || false)}
                style={{
                  backgroundColor: item.masque ? '#4caf50' : '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {item.masque ? 'Afficher' : 'Masquer'}
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete("Plats", String(item.id))}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2>Boissons</h2>
      <ul className="item-list">
        {boissons.filter(item => 
          item.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.filtre?.[0]?.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(item => (
          <li key={item.id} className="item-card">
            {item.image && <img src={item.image} alt={item.nom} className="item-img" />}
            <div className="item-info">
              <b>{item.nom}</b> - {formatPrix(item)} <br />
              <i>Catégorie: {item.filtre?.[0]}</i>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="edit-btn"
                onClick={() => {
                  setEditId(String(item.id));
                  setEditingCollection("Boissons");
                  setNom(item.nom || "");
                  setDescription(item.description || "");
                  if (typeof item.prix === "string") setPrix([{ label: "", value: item.prix }]);
                  else setPrix(item.prix as PriceOption[]);
                  setCategorie(item.catégorie?.[0] || "boissons");
                  setFiltre(item.filtre?.[0] || ""); // Charger le filtre
                  setImageUrl(item.image || "");
                }}
              >
                Modifier
              </button>
              <button
                className={item.masque ? "show-btn" : "hide-btn"}
                onClick={() => toggleItemVisibility("Boissons", String(item.id), item.masque || false)}
                style={{
                  backgroundColor: item.masque ? '#4caf50' : '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {item.masque ? 'Afficher' : 'Masquer'}
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete("Boissons", String(item.id))}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
        </>
      )}

      {/* Contenu de l'onglet Commandes */}
      {activeTab === 'commandes' && (
        <div className="commandes-section">
          <h2>Gestion des Commandes</h2>
          
          {commandes.length === 0 ? (
            <p className="commandes-no-data">Aucune commande trouvée.</p>
          ) : (
            <div className="commandes-list">
              {commandes.map((commande) => (
                <div key={commande.id} className="commande-card">
                  <div className="commande-header">
                    <div className="commande-client">
                      <h3>
                        {commande.clientPrenom} {commande.clientNom}
                      </h3>
                      <p>
                        {formatDate(commande.dateCommande)} • {commande.localisation}
                      </p>
                    </div>
                    <div className="commande-total">
                      <p>
                        {formatPrixCommande(commande.total)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="commande-items">
                    <h4>Articles commandés:</h4>
                    <ul>
                      {commande.items.map((item, index) => (
                        <li key={index}>
                          {item.nom} × {item.quantité} ({item.prix})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="commande-actions">
                    <div className="commande-status-group">
                      <label className="commande-status-label">Statut:</label>
                      <select 
                        value={commande.statut}
                        onChange={(e) => updateCommandeStatut(commande.id, e.target.value)}
                        className="commande-status-select"
                        style={{ backgroundColor: getStatutColor(commande.statut) }}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="en_preparation">En préparation</option>
                        <option value="prete">Prête</option>
                        <option value="livree">Livrée</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={() => deleteCommande(commande.id)}
                      className="commande-delete-btn"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


    </div>
  );
}
