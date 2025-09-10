import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

async function uploadAllImages() {
  const assetsPath = join(__dirname, 'assets');
  const files = readdirSync(assetsPath);
  
  for (const file of files) {
    try {
      const filePath = join(assetsPath, file);
      const fileBuffer = readFileSync(filePath);
      
      // Nettoyer le nom de fichier (supprimer caractères spéciaux)
      const cleanFileName = file
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[&]/g, '-')
        .replace(/[ñ]/g, 'n');
      
      const storageRef = ref(storage, `images/${cleanFileName}`);
      
      await uploadBytes(storageRef, fileBuffer);
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log(`✅ Uploaded: ${file} -> ${cleanFileName}`);
      console.log(`URL: ${downloadURL}`);
      
    } catch (error) {
      console.error(`❌ Error uploading ${file}:`, error);
    }
  }
}

// Exécuter l'upload
uploadAllImages().then(() => {
  console.log('🎉 All images uploaded successfully!');
}).catch(console.error);