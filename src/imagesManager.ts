// Gestionnaire d'images qui combine les imports statiques et les chemins publics
import { images as staticImages } from './images';
import { images as pathImages } from './imagesFirebase';

// Fonction pour obtenir l'URL d'une image
export function getImageUrl(imageName: keyof typeof staticImages): string {
  try {
    // Essayer d'abord l'import statique (recommandé pour Vite)
    const staticImage = staticImages[imageName];
    if (staticImage && typeof staticImage === 'string') {
      return staticImage;
    }
  } catch (error) {
    console.warn(`Fallback to path for image: ${imageName}`);
  }
  
  // Fallback vers le chemin public
  return pathImages[imageName] || '';
}

// Export des images avec la fonction de résolution
export const images = new Proxy({} as typeof staticImages, {
  get(target, prop: string) {
    return getImageUrl(prop as keyof typeof staticImages);
  }
});