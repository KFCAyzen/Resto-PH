import type { MenuItem } from "../types";
import { formatFCFA, parsePrix } from "./commandes";

// Plus petit prix de l'item, ou null si aucun prix n'est renseigné (ex. accompagnements)
export function prixMinimum(item: MenuItem): number | null {
  const valeurs = (Array.isArray(item.prix) ? item.prix.map(p => p.value) : [item.prix])
    .map(v => parsePrix(v ?? ""))
    .filter(v => v > 0);
  return valeurs.length ? Math.min(...valeurs) : null;
}

// "4000 FCFA" → "4 000 FCFA" ; une valeur sans chiffre est affichée telle quelle
export function formatPrixTexte(prix: string): string {
  const valeur = parsePrix(prix);
  return valeur > 0 ? formatFCFA(valeur) : prix.trim();
}

export const PRIX_SUR_DEMANDE = "Prix sur demande";

export function prixAffiche(item: MenuItem): string {
  if (Array.isArray(item.prix)) {
    const min = prixMinimum(item);
    return min !== null ? `À partir de ${formatFCFA(min)}` : PRIX_SUR_DEMANDE;
  }
  return item.prix?.trim() ? formatPrixTexte(item.prix) : PRIX_SUR_DEMANDE;
}

// Recherche insensible à la casse et aux accents ("braise" trouve "Braisé")
export function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Les items du panier ont toujours un prix unique (string) au moment de l'ajout
export function prixUnitaire(item: MenuItem): string {
  if (typeof item.prix === "string") return item.prix;
  const selected = item.prix.find(p => p.selected) ?? item.prix[0];
  return selected?.value ?? "";
}

export function cleCommande(item: MenuItem): string {
  return `${item.id}-${prixUnitaire(item)}`;
}

// Items visibles uniquement, un seul par nom (évite les doublons entre données initiales et ajouts manuels)
export function dedupeParNom(items: MenuItem[]): MenuItem[] {
  const parNom = new Map<string, MenuItem>();
  for (const item of items) {
    if (item.masque) continue;
    const key = normaliser(item.nom);
    if (!parNom.has(key)) parNom.set(key, item);
  }
  return Array.from(parNom.values());
}
