
import React, { useState } from 'react' ;
import pouletDG from './assets/poulet_DG.jpg'; 
import { images } from "./images";

type MenuItem = {
  id: number;
  nom: string;
  prix: string;
  image: string;
  description: string;
};

const menuItems: MenuItem[] = [
  {
    id: 1,
    nom: "Poulet DG",
    prix: "4000 FCFA",
    image: pouletDG,
    description: "Poulet frit mijoté avec plantains mûrs, légumes et épices."
  },
  {
    id: 2,
    nom: "Pomme sauté à la viande boeuf",
    prix: "3000 FCFA",
    image: images.pommeViande,
    description: "Poulet mariné et grillé au feu de bois, tendre et savoureux."
  },
  {
    id: 3,
    nom: "Poulet Braisé",
    prix: "4000 FCFA",
    image: images.pouletBraisé,
    description: "Poulet mariné et grillé au feu de bois, tendre et savoureux."
  },
  {
    id: 4,
    nom: "Taro Sauce Jaune",
    prix: "2500 FCFA",
    image: images.taro,
    description: "Taro pilé accompagné d'une sauce jaune aux épices et huile de palme.Plat traditionnel Bamiléké très prisé disponible tout les dimanches"
  },
  {
    id: 5,
    nom: "Bouillon chaud",
    prix: "2500 FCFA",
    image: images.bouillon,
    description: "Bouillon épicé à base de viande de bœuf, servi bien chaud avec des épices locales. Disponible tout les dimanches"
  },
  {
    id: 6,
    nom: "Ndolé",
    prix: "3000 FCFA",
    image: images.ndolé,
    description: "Feuilles d’oseille amère mijotées avec viande et pâte d’arachide."
  },
  {
    id: 7,
    nom: "Saucisses grillées",
    prix: "2000 FCFA",
    image: images.saucisse,
    description: "Saucisses épicées grillées, servies chaudes."
  },
  {
    id: 8,
    nom: "Émincés de boeuf",
    prix: "2000 FCFA",
    image: images.émincé,
    description: "Fines lamelles de bœuf sautées, sauce légère et savoureuse."
  },
  {
    id: 9,
    nom: "Trippes de boeuf",
    prix: "6000 FCFA",
    image: images.tripes,
    description: "Tripes nettoyées et sautées avec condiments, texture fondante."
  },
  {
    id: 10,
    nom: "Rognons de boeuf",
    prix: "6000 FCFA",
    image: images.rognon,
    description: "Rognons tendres sautés à la poêle avec oignons, divers épices et piment doux."
  },
  {
    id: 11,
    nom: "Ndolé au poisson Fumé",
    prix: "2500 FCFA",
    image: images.ndoléFumé,
    description: "Ndolé revisité avec poisson fumée, goût intense et rustique."
  },
  {
    id: 12,
    nom: "Pommes sautées avec poisson",
    prix: "2500 FCFA",
    image: images.pommePoisson,
    description: "Pommes de terre sautées accompagnées de filets de poisson épicé."
  },
  {
    id: 13,
    nom: "Poulet Yassa",
    prix: "5000 FCFA",
    image: images.pouletYassa,
    description: "Poulet mariné aux oignons, citron et moutarde, originaire du Sénégal."
  },
  {
    id: 14,
    nom: "Bar Braisé",
    prix: "7000 - 8000 FCFA",
    image: images.barBraisé,
    description: "Filet de bar rôti à la braise, peau croustillante chaire tendre."
  },
  {
    id: 15,
    nom: "Bar Calada Braisé",
    prix: "5000 - 6000 FCFA",
    image: images.calada,
    description: "Bar calada rôti à la braise avec un mélange d'épices exotiques."
  },
  {
    id: 16,
    nom: "Carpe Braisé",
    prix: "4000 - 5000 FCFA",
    image: images.carpe,
    description: "Carpe entière grillé, parfumée aux herbes et condiments locaux."
  },
  {
    id: 17,
    nom: "Foie de boeuf sauté",
    prix: "3000 FCFA",
    image: images.foie,
    description: "Foie de boeuf sauté aux oignons et poivrons, tendre et parfumé."
  },
  {
    id: 18,
    nom: "Omelette Nature",
    prix: "1500 FCFA",
    image: images.omlette,
    description: "Omelette simple aux oeufs battus, légère et moelleuse."
  },
  {
    id: 19,
    nom: "Omelette Sardine",
    prix: "2000 FCFA",
    image: images.omletteSardine,
    description: "Omelette garnie de sardines et dépices douces."
  },
  {
    id: 20,
    nom: "Omelette Saucisson",
    prix: "2000 FCFA",
    image: images.omletteSaucisson,
    description: "Omelette généreuse au saucisson, parfaite pour les gourmands."
  },
  {
    id: 21,
    nom: "Tasse de lait",
    prix: "500 FCFA",
    image: images.tasse,
    description: "Lait chaud servi nature, doux et reconfortant."
  },
  {
    id: 22,
    nom: "Thé Citron",
    prix: "500 FCFA",
    image: images.théCitron,
    description: "Infusion légère au citron, rafraichissanté et tonifiante"
  },
  {
    id: 23,
    nom: "Thé Menthe",
    prix: "500 FCFA",
    image: images.théMenthe,
    description: "Thé vert infusé à la menthe fraîche, apaisant et parfumé."
  },
  {
    id: 24,
    nom: "Thé Vert",
    prix: "500 FCFA",
    image: images.théVert,
    description: "Thé classique riche en antioxydants, goût pur et naturel."
  }
];

const MenuPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  return ( 
    <div>
      <div className='menu'>
        {menuItems.map((item) => (
          <div
            className={`menuitem ${item.nom === 'Taro Sauce Jaune' || item.nom === 'Bouillon chaud' ? 'spec' : ''}`}
            key={item.id}
            onClick={() => setSelectedItem(item)}
            style={{ cursor: 'pointer' }}
          >
            <img src={item.image} alt={item.nom} />
            <h2>{item.nom}</h2>
            <p>{item.prix}</p>
          </div>
        ))}
      </div>

      {selectedItem && (
        <>
          <div className="overlay" onClick={() => setSelectedItem(null)}></div>
          <div className="modal">
            <h2>{selectedItem.nom}</h2>
            <img src={selectedItem.image} alt={selectedItem.nom} />
            <p><strong>Description :</strong> {selectedItem.description}</p>
            <p><strong>Prix :</strong> {selectedItem.prix}</p>
            <button onClick={() => setSelectedItem(null)}>Fermer</button>
          </div>
        </>
      )}
    </div>
  );
};

export default MenuPage;
