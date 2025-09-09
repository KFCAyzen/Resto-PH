import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { MenuItem } from "../types";

export function useRealtimeCollection(collectionName: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const q = query(collection(db, collectionName));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            nom: data.nom ?? "",
            description: data.description ?? "",
            prix: data.prix,
            image: data.image ?? "",
            catégorie: Array.isArray(data.catégorie) ? data.catégorie : [],
          } as MenuItem;
        });
        setItems(docs);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Erreur de chargement");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [collectionName]);

  return { items, loading, error } as const;
}


