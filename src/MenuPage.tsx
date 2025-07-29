
import React, { useState } from 'react' ;
import pouletDG from './assets/poulet_DG.jpg'; 

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
    prix: "6000 FCFA",
    image: pouletDG,
    description: "Poulet DG avec plantain mûr et légumes"
  },
  {
    id: 2,
    nom: "Poulet Braisé",
    prix: "6000 FCFA",
    image: "https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_488,q_auto,w_650/https://s3-eu-west-1.amazonaws.com/images-ca-1-0-1-eu/recipe_photos/original/221913/poulet_DG.jpg",
    description: "Poulet braisé accompagné de frites"
  },
  {
    id: 3,
    nom: "Poulet Braisé",
    prix: "6000 FCFA",
    image: "https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_488,q_auto,w_650/https://s3-eu-west-1.amazonaws.com/images-ca-1-0-1-eu/recipe_photos/original/221913/poulet_DG.jpg",
    description: "Poulet braisé accompagné de frites"
  },
  {
    id: 4,
    nom: "Taro Sauce Jaune",
    prix: "6000 FCFA",
    image: "https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_488,q_auto,w_650/https://s3-eu-west-1.amazonaws.com/images-ca-1-0-1-eu/recipe_photos/original/221913/poulet_DG.jpg",
    description: "Plat traditionnel Bamiléké très prisé"
  },
  {
    id: 5,
    nom: "Bouillon chaud",
    prix: "6000 FCFA",
    image: "https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_488,q_auto,w_650/https://s3-eu-west-1.amazonaws.com/images-ca-1-0-1-eu/recipe_photos/original/221913/poulet_DG.jpg",
    description: "Bouillon épicé avec viande de boeuf pour se rechauffer"
  },
  {
    id: 6,
    nom: "Ndolè",
    prix: "6000 FCFA",
    image: "https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_488,q_auto,w_650/https://s3-eu-west-1.amazonaws.com/images-ca-1-0-1-eu/recipe_photos/original/221913/poulet_DG.jpg",
    description: "Ndolé au boeuf"
  },
  {
    id: 7,
    nom: "Saucisses",
    prix: "6000 FCFA",
    image: "https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_488,q_auto,w_650/https://s3-eu-west-1.amazonaws.com/images-ca-1-0-1-eu/recipe_photos/original/221913/poulet_DG.jpg",
    description: "Saucisses sautées aux oignons"
  },
  {
    id: 8,
    nom: "Émincés de boeuf",
    prix: "6000 FCFA",
    image: "https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_488,q_auto,w_650/https://s3-eu-west-1.amazonaws.com/images-ca-1-0-1-eu/recipe_photos/original/221913/poulet_DG.jpg",
    description: "Tranches frites de boeuf sautées aux légumes"
  },
  {
    id: 9,
    nom: "Trippes de boeuf",
    prix: "6000 FCFA",
    image: "https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_488,q_auto,w_650/https://s3-eu-west-1.amazonaws.com/images-ca-1-0-1-eu/recipe_photos/original/221913/poulet_DG.jpg",
    description: "Tranches de tripes de boeuf sautées aux légumes"
  },
  {
    id: 10,
    nom: "Rognons de boeuf",
    prix: "6000 FCFA",
    image: "https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_488,q_auto,w_650/https://s3-eu-west-1.amazonaws.com/images-ca-1-0-1-eu/recipe_photos/original/221913/poulet_DG.jpg",
    description: "Rognon de boeuf sautées aux légumes"
  }
];

const MenuPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  return ( 
    <div>
      <div className='menu'>
        {menuItems.map((item) => (
          <div className={`menuitem ${item.nom === 'Taro Sauce Jaune' || item.nom === 'Bouillon chaud' ? 'spec' : ''}`} key={item.id}
          onClick={() => setSelectedItem(item)}
          style={{cursor: 'pointer'}}>
            <img src={item.image} alt={item.nom} />
            <h2>{item.nom} </h2>
            <p>{item.prix} </p>
          </div>
        ))}
      </div>

      {selectedItem && ( 
        <div className='details' style={{ border: '1px solid gray', padding: '10px', margin: '20px' }}>
          <h2>{selectedItem.nom} </h2>
          <img src={selectedItem.image} alt={selectedItem.nom} width="200" />
          <p><strong>Description :</strong> {selectedItem.description} </p>
          <p><strong>Prix: </strong>{selectedItem.prix} </p>
          <button onClick={() => setSelectedItem(null)}>Fermer</button>
        </div>
      )}
    </div>
  )
}

export default MenuPage;