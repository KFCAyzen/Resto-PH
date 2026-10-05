import type { Timestamp } from "firebase/firestore";

export type StatutCommande = "en_attente" | "en_preparation" | "prete" | "livree";

export interface Commande {
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
  // null tant que le serverTimestamp n'est pas encore résolu
  dateCommande: Timestamp | null;
  statut: StatutCommande;
}

export const STATUTS: { value: StatutCommande; label: string; color: string }[] = [
  { value: "en_attente", label: "En attente", color: "#e67e00" },
  { value: "en_preparation", label: "En préparation", color: "#1976d2" },
  { value: "prete", label: "Prête", color: "#2e7d32" },
  { value: "livree", label: "Livrée", color: "#757575" },
];

export function statutLabel(statut: string): string {
  return STATUTS.find(s => s.value === statut)?.label ?? statut;
}

export function statutColor(statut: string): string {
  return STATUTS.find(s => s.value === statut)?.color ?? "#757575";
}

// "4000 FCFA", "4 000", "4000" → 4000 ; chaîne vide ou sans chiffre → 0
export function parsePrix(prix: string): number {
  const parsed = parseInt(String(prix ?? "").replace(/[^\d]/g, ""), 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatFCFA(valeur: number): string {
  return valeur.toLocaleString("fr-FR") + " FCFA";
}

export function formatDate(timestamp: Timestamp | null | undefined): string {
  return timestamp ? timestamp.toDate().toLocaleString("fr-FR") : "À l'instant";
}
