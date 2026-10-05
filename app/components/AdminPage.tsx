import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { collection, addDoc, doc, deleteDoc, getDoc, setDoc, updateDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { uploadImageFromBrowser } from "../upLoadFirebase";
import type { MenuItem } from "../types";
import { useRealtimeCollection } from "../hooks/useRealtimeCollection"; // Hook temps réel
import { useToast } from "../hooks/useToast";
import { type Commande, STATUTS, formatDate, formatFCFA, statutColor, statutLabel } from "../lib/commandes";
import { formatPrixTexte, normaliser } from "../lib/menu";
import HistoriquePage from "./HistoriquePage";
import "../AdminPage.css";
import { images } from "../imagesFallback";

type NomCollection = "Plats" | "Boissons";
type PriceOption = { label: string; value: string; selected?: boolean };

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Seules les images uploadées depuis l'admin (images/<catégorie>/<fichier>) appartiennent à un seul item.
// Les images à la racine de images/ sont partagées entre plusieurs items : on ne les supprime jamais.
function getUploadedStoragePath(url: string): string | null {
  const match = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)/);
  if (!match) return null;
  const path = decodeURIComponent(match[1]);
  return /^images\/[^/]+\/.+/.test(path) ? path : null;
}

// "4000", "4 000" ou "4000 fcfa" → "4000 FCFA" ; une valeur non numérique est gardée telle quelle
function normaliserPrix(valeur: string): string {
  const v = valeur.trim();
  return /^[\d\s.]+(f?\s?cfa|f)?$/i.test(v) ? `${v.replace(/[^\d]/g, "")} FCFA` : v;
}

function formatPrixItem(item: MenuItem): string {
  if (typeof item.prix === "string") return item.prix.trim() ? formatPrixTexte(item.prix) : "Sans prix";
  return item.prix.map(p => `${p.label ? p.label + " - " : ""}${formatPrixTexte(p.value)}`).join(", ");
}

export default function AdminPage() {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState<PriceOption[]>([]);
  const [nomCollection, setNomCollection] = useState<NomCollection>("Plats");
  const [categories, setCategories] = useState(""); // catégories séparées par des virgules
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"menu" | "commandes" | "historique">("menu");
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast, toastElement } = useToast();

  // --- Récupération temps réel des collections ---
  const { items: plats, loading: loadingPlats } = useRealtimeCollection("Plats");
  const { items: boissons, loading: loadingBoissons } = useRealtimeCollection("Boissons");

  // Récupération temps réel des commandes
  useEffect(() => {
    const q = query(collection(db, "commandes"), orderBy("dateCommande", "desc"));
    const unsubscribe = onSnapshot(
      q,
      snapshot => setCommandes(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Commande)),
      err => console.error("Erreur de chargement des commandes:", err)
    );
    return () => unsubscribe();
  }, []);

  const commandesActives = commandes.filter(c => c.statut !== "livree");

  // Suggestions : catégories et images déjà utilisées
  const categoriesExistantes = useMemo(() => {
    const source = nomCollection === "Plats" ? plats : boissons;
    return Array.from(new Set(source.flatMap(i => i.catégorie))).sort((a, b) => a.localeCompare(b, "fr"));
  }, [nomCollection, plats, boissons]);

  const imagesExistantes = useMemo(
    () => Array.from(new Set([...plats, ...boissons].map(i => i.image).filter(src => typeof src === "string" && src.startsWith("/")))).sort(),
    [plats, boissons]
  );

  const resetForm = () => {
    setNom("");
    setDescription("");
    setPrix([]);
    setNomCollection("Plats");
    setCategories("");
    setImageUrl("");
    setEditId(null);
    setFormError(null);
  };

  /* Upload fichier */
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError("Le fichier doit être une image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFormError("L'image dépasse 5 Mo. Choisissez une image plus légère.");
      return;
    }
    setFormError(null);
    setUploading(true);
    try {
      const categorie = categories.split(",")[0]?.trim() || "general";
      setImageUrl(await uploadImageFromBrowser(file, categorie));
    } catch (err) {
      console.error(err);
      setFormError("L'envoi de l'image a échoué (Firebase Storage indisponible). Vous pouvez choisir une image existante dans le champ « Chemin de l'image ».");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  /* Gestion des options de prix (mises à jour immuables) */
  const addPriceOption = () => setPrix(prev => [...prev, { label: "", value: "" }]);
  const updatePriceOption = (index: number, field: "label" | "value", val: string) =>
    setPrix(prev => prev.map((opt, i) => (i === index ? { ...opt, [field]: val } : opt)));
  const removePriceOption = (index: number) => setPrix(prev => prev.filter((_, i) => i !== index));

  const startEdit = (item: MenuItem, nomColl: NomCollection) => {
    setEditId(String(item.id));
    setNomCollection(nomColl);
    setNom(item.nom || "");
    setDescription(item.description || "");
    if (typeof item.prix !== "string") setPrix(item.prix.map(p => ({ ...p })));
    else setPrix(item.prix.trim() ? [{ label: "", value: item.prix }] : []);
    setCategories((item.catégorie ?? []).join(", "));
    setImageUrl(item.image || "");
    setFormError(null);
    setActiveTab("menu");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* Soumission Firestore */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const cats = Array.from(new Set(categories.split(",").map(c => c.trim()).filter(Boolean)));
    const options = prix.map(p => ({ ...p, label: p.label.trim(), value: normaliserPrix(p.value) }));

    let erreur: string | null = null;
    if (!nom.trim()) erreur = "Merci de renseigner un nom.";
    else if (nomCollection === "Plats" && !description.trim()) erreur = "Merci de renseigner une description pour les plats.";
    else if (options.some(p => !p.value)) erreur = "Chaque option de prix doit avoir une valeur.";
    else if (options.length >= 2 && options.some(p => !p.label)) erreur = "Le libellé est obligatoire quand il y a plusieurs prix.";
    else if (cats.length === 0) erreur = "Merci de renseigner au moins une catégorie.";
    else if (!imageUrl.trim()) erreur = "Merci d'ajouter une image.";
    if (erreur) {
      setFormError(erreur);
      return;
    }

    // Aucune option → article sans prix ("Prix sur demande") ; une seule option sans libellé → juste la valeur
    const prixField: string | PriceOption[] =
      options.length === 0 ? "" : options.length === 1 && !options[0].label ? options[0].value : options;
    const data = {
      nom: nom.trim(),
      description: description.trim(),
      prix: prixField,
      catégorie: cats,
      filtre: cats,
      image: imageUrl.trim(),
    };

    setSaving(true);
    setFormError(null);
    try {
      if (editId) {
        // merge : le champ masque existant est conservé
        await setDoc(doc(db, nomCollection, editId), data, { merge: true });
      } else {
        await addDoc(collection(db, nomCollection), { ...data, masque: false });
      }
      showToast(editId ? `« ${data.nom} » modifié` : `« ${data.nom} » ajouté`);
      resetForm();
    } catch (err) {
      console.error(err);
      setFormError(editId ? "Erreur lors de la modification." : "Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  };

  /* Suppression Firestore + image uploadée */
  const handleDelete = async (nomColl: NomCollection, item: MenuItem) => {
    if (!window.confirm(`Supprimer « ${item.nom} » du menu ?`)) return;
    const id = String(item.id);
    try {
      const itemDoc = await getDoc(doc(db, nomColl, id));
      const path = itemDoc.exists() ? getUploadedStoragePath(String(itemDoc.data().image ?? "")) : null;
      // Ne pas bloquer la suppression de l'item si Firebase Storage est indisponible
      if (path) await deleteObject(ref(storage, path)).catch(err => console.warn("Image Storage non supprimée:", err));
      await deleteDoc(doc(db, nomColl, id));
      if (editId === id) resetForm();
      showToast(`« ${item.nom} » supprimé`);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const toggleItemVisibility = async (nomColl: NomCollection, item: MenuItem) => {
    const masque = !item.masque;
    try {
      await updateDoc(doc(db, nomColl, String(item.id)), { masque });
      showToast(`« ${item.nom} » ${masque ? "masqué du menu" : "visible dans le menu"}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  // Gestion des commandes
  const updateCommandeStatut = async (commandeId: string, nouveauStatut: string) => {
    try {
      await updateDoc(doc(db, "commandes", commandeId), { statut: nouveauStatut });
      showToast(`Statut : ${statutLabel(nouveauStatut)}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      showToast("Erreur lors de la mise à jour du statut", "error");
    }
  };

  const deleteCommande = async (commande: Commande) => {
    if (!window.confirm(`Supprimer la commande de ${commande.clientPrenom} ${commande.clientNom} ?`)) return;
    try {
      await deleteDoc(doc(db, "commandes", commande.id));
      showToast("Commande supprimée");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
      showToast("Déconnexion impossible", "error");
    }
  };

  const recherche = normaliser(searchTerm);
  const filtrerEtTrier = (items: MenuItem[]) =>
    items
      .filter(item => !recherche || normaliser(`${item.nom} ${item.catégorie.join(" ")}`).includes(recherche))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  const renderItemList = (titre: NomCollection, items: MenuItem[]) => {
    const visibles = filtrerEtTrier(items);
    return (
      <>
        <h2>{titre} ({visibles.length})</h2>
        {visibles.length === 0 ? (
          <p className="admin-empty">Aucun item trouvé.</p>
        ) : (
          <ul className="item-list">
            {visibles.map(item => (
              <li key={item.id} className={`item-card ${item.masque ? "is-hidden" : ""} ${editId === String(item.id) ? "is-editing" : ""}`}>
                {item.image && <img src={item.image} alt="" className="item-img" loading="lazy" />}
                <div className="item-info">
                  <b>{item.nom}</b>
                  {item.masque && <span className="item-badge">Masqué</span>}
                  <span className="item-meta">{formatPrixItem(item)}</span>
                  <span className="item-meta">{item.catégorie.join(", ")}</span>
                </div>
                <div className="item-actions">
                  <button type="button" className="edit-btn" onClick={() => startEdit(item, titre)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className={item.masque ? "show-btn" : "hide-btn"}
                    onClick={() => toggleItemVisibility(titre, item)}
                  >
                    {item.masque ? "Afficher" : "Masquer"}
                  </button>
                  <button type="button" className="delete-btn" onClick={() => handleDelete(titre, item)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Back Office</h1>
        <button type="button" className="admin-logout-btn" onClick={handleLogout}>
          <img src={images.logOut} alt="" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Onglets */}
      <div className="admin-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "menu"}
          onClick={() => setActiveTab("menu")}
          className={`admin-tab-btn ${activeTab === "menu" ? "active" : ""}`}
        >
          <img src={activeTab === "menu" ? images.gestionActif : images.gestion} alt="" />
          <span>Gestion du Menu</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "commandes"}
          onClick={() => setActiveTab("commandes")}
          className={`admin-tab-btn ${activeTab === "commandes" ? "active" : ""}`}
        >
          <img src={activeTab === "commandes" ? images.commandesActif : images.commandes} alt="" />
          <span>Commandes ({commandesActives.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "historique"}
          onClick={() => setActiveTab("historique")}
          className={`admin-tab-btn ${activeTab === "historique" ? "active" : ""}`}
        >
          <img src={activeTab === "historique" ? images.historiqueActif : images.historique} alt="" />
          <span>Historique</span>
        </button>
      </div>

      {/* Contenu de l'onglet Menu */}
      {activeTab === "menu" && (
        <>
          <form className="admin-form" onSubmit={handleSubmit} ref={formRef} noValidate>
            <h2 className="admin-form-title">{editId ? `Modifier « ${nom || "item"} »` : "Ajouter un item"}</h2>

            <div className="form-row-group">
              <div className="form-field">
                <label className="field-label" htmlFor="admin-collection">Collection</label>
                <select
                  id="admin-collection"
                  value={nomCollection}
                  onChange={e => setNomCollection(e.target.value as NomCollection)}
                  className="form-select"
                  disabled={!!editId}
                >
                  <option value="Plats">Plats</option>
                  <option value="Boissons">Boissons</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label" htmlFor="admin-categories">Catégories</label>
                <input
                  id="admin-categories"
                  type="text"
                  list="admin-categories-list"
                  placeholder="Ex : Plats principaux, Plats chaud"
                  value={categories}
                  onChange={e => setCategories(e.target.value)}
                  className="form-input"
                />
                <datalist id="admin-categories-list">
                  {categoriesExistantes.map(cat => <option key={cat} value={cat} />)}
                </datalist>
                <small className="field-hint">Plusieurs catégories : séparez-les par des virgules.</small>
              </div>
            </div>

            <div className="form-field">
              <label className="field-label" htmlFor="admin-nom">Nom</label>
              <input
                id="admin-nom"
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="field-label" htmlFor="admin-description">
                Description{nomCollection === "Boissons" ? " (facultatif)" : ""}
              </label>
              <textarea
                id="admin-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="price-options-section">
              <p className="field-label">Prix</p>
              {prix.map((opt, idx) => (
                <div key={idx} className="price-option">
                  <input
                    type="text"
                    placeholder={prix.length >= 2 ? "Libellé (ex. Moyen)" : "Libellé (facultatif)"}
                    aria-label={`Libellé du prix ${idx + 1}`}
                    value={opt.label || ""}
                    onChange={e => updatePriceOption(idx, "label", e.target.value)}
                    className="price-input"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Prix (ex. 4000)"
                    aria-label={`Valeur du prix ${idx + 1}`}
                    value={opt.value || ""}
                    onChange={e => updatePriceOption(idx, "value", e.target.value)}
                    className="price-input"
                  />
                  <button type="button" onClick={() => removePriceOption(idx)} className="price-remove-btn" aria-label={`Retirer le prix ${idx + 1}`}>
                    <img src={images.cross} alt="" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addPriceOption} className="add-price-btn">
                + Ajouter une option de prix
              </button>
              {prix.length === 0 && (
                <small className="field-hint">Sans option de prix, l'article s'affiche « Prix sur demande » (ex. accompagnements).</small>
              )}
            </div>

            <div className="form-field">
              <span className="field-label">Image</span>
              <button
                type="button"
                className={`drop-zone ${uploading ? "active" : ""}`}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Envoi en cours..." : "Glissez-déposez une image ou cliquez pour en choisir une"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />
              <label className="field-label field-label-secondary" htmlFor="admin-image">
                Ou chemin de l'image
              </label>
              <input
                id="admin-image"
                type="text"
                list="admin-images-list"
                placeholder="Ex : /coca.jpeg"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="form-input"
              />
              <datalist id="admin-images-list">
                {imagesExistantes.map(src => <option key={src} value={src} />)}
              </datalist>
            </div>

            {imageUrl && (
              <div className="preview">
                <img src={imageUrl} alt="Aperçu" className="item-img" />
              </div>
            )}

            {formError && <p className="form-error" role="alert">{formError}</p>}

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={uploading || saving}>
                {saving ? "Enregistrement..." : editId ? "Enregistrer les modifications" : "Ajouter au menu"}
              </button>
              {editId && (
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Annuler
                </button>
              )}
            </div>
          </form>

          {/* Barre de recherche */}
          <div className="search-section">
            <input
              type="search"
              placeholder="Rechercher un item ou une catégorie..."
              aria-label="Rechercher un item"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loadingPlats || loadingBoissons ? (
            <div className="page-loader">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {renderItemList("Plats", plats)}
              {renderItemList("Boissons", boissons)}
            </>
          )}
        </>
      )}

      {/* Contenu de l'onglet Commandes */}
      {activeTab === "commandes" && (
        <div className="commandes-section">
          <h2>Commandes en cours</h2>

          {commandesActives.length === 0 ? (
            <p className="commandes-no-data">Aucune commande en cours. Les commandes livrées sont dans l'historique.</p>
          ) : (
            <div className="commandes-list">
              {commandesActives.map(commande => (
                <div key={commande.id} className="commande-card">
                  <div className="commande-header">
                    <div className="commande-client">
                      <h3>{commande.clientPrenom} {commande.clientNom}</h3>
                      <p>{formatDate(commande.dateCommande)} • {commande.localisation}</p>
                    </div>
                    <div className="commande-total">
                      <p>{formatFCFA(commande.total)}</p>
                    </div>
                  </div>

                  <div className="commande-items">
                    <h4>Articles commandés :</h4>
                    <ul>
                      {commande.items.map((item, index) => (
                        <li key={index}>
                          {item.nom} × {item.quantité} ({formatPrixTexte(item.prix) || "prix sur demande"})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="commande-actions">
                    <div className="commande-status-group">
                      <label className="commande-status-label" htmlFor={`statut-${commande.id}`}>Statut :</label>
                      <select
                        id={`statut-${commande.id}`}
                        value={commande.statut}
                        onChange={e => updateCommandeStatut(commande.id, e.target.value)}
                        className="commande-status-select"
                        style={{ backgroundColor: statutColor(commande.statut) }}
                      >
                        {STATUTS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <button type="button" onClick={() => deleteCommande(commande)} className="commande-delete-btn">
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "historique" && <HistoriquePage commandes={commandes} />}

      {toastElement}
    </div>
  );
}
