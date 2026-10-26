import type { IconOption } from '../components/IconPicker';
import { materialSymbolNames } from './materialSymbolNames';

const chorePriorityIcons: IconOption[] = [
  { value: 'mi:cleaning_services', label: 'Nettoyage' },
  { value: 'mi:local_laundry_service', label: 'Lessive' },
  { value: 'mi:kitchen', label: 'Cuisine' },
  { value: 'mi:delete', label: 'Poubelle' },
  { value: 'mi:bed', label: 'Chambre' },
  { value: 'mi:yard', label: 'Jardin' },
  { value: 'mi:pets', label: 'Animaux' },
  { value: 'mi:menu_book', label: 'Devoirs' },
  { value: 'mi:home_repair_service', label: 'Réparation' },
  { value: 'mi:inventory_2', label: 'Rangement' },
];

const rewardPriorityIcons: IconOption[] = [
  { value: 'mi:card_giftcard', label: 'Cadeau' },
  { value: 'mi:sports_esports', label: 'Jeux vidéo' },
  { value: 'mi:movie', label: 'Film' },
  { value: 'mi:wifi', label: 'Internet' },
  { value: 'mi:smartphone', label: 'Téléphone' },
  { value: 'mi:headphones', label: 'Musique' },
  { value: 'mi:local_pizza', label: 'Pizza' },
  { value: 'mi:cake', label: 'Dessert' },
  { value: 'mi:park', label: 'Sortie parc' },
  { value: 'mi:shopping_bag', label: 'Shopping' },
  { value: 'mi:redeem', label: 'Bon cadeau' },
  { value: 'mi:star', label: 'Bonus' },
];

const iconAliases: Record<string, string[]> = {
  'mi:cleaning_services': ['ménage', 'nettoyer', 'balai', 'aspirateur', 'cleaning', 'vacuum'],
  'mi:local_laundry_service': ['linge', 'laver', 'machine à laver', 'lessive', 'laundry', 'washing'],
  'mi:kitchen': ['cuisine', 'cuisiner', 'repas', 'cooking'],
  'mi:delete': ['poubelle', 'ordures', 'déchets', 'trash', 'garbage'],
  'mi:bed': ['lit', 'chambre', 'faire le lit', 'bedroom'],
  'mi:yard': ['jardin', 'jardinage', 'tondre', 'gazon', 'garden', 'lawn'],
  'mi:pets': ['animal', 'animaux', 'chien', 'chat', 'pet', 'dog', 'cat'],
  'mi:menu_book': ['livre', 'lecture', 'lire', 'devoirs', 'homework', 'reading'],
  'mi:home_repair_service': ['réparer', 'réparation', 'bricolage', 'repair', 'tool'],
  'mi:inventory_2': ['rangement', 'ranger', 'organiser', 'tidy', 'storage'],
  'mi:card_giftcard': ['cadeau', 'présent', 'gift', 'present'],
  'mi:sports_esports': ['jeu', 'jeux vidéo', 'gaming', 'video game'],
  'mi:movie': ['film', 'cinéma', 'movie', 'cinema'],
  'mi:wifi': ['internet', 'wi-fi', 'connexion', 'network'],
  'mi:smartphone': ['téléphone', 'mobile', 'phone'],
  'mi:headphones': ['musique', 'casque', 'écouteurs', 'music', 'headset'],
  'mi:local_pizza': ['pizza', 'nourriture', 'food'],
  'mi:shopping_bag': ['shopping', 'courses', 'magasin', 'boutique', 'store'],
  'mi:directions_car': ['voiture', 'auto', 'car', 'automobile'],
  'mi:clean_hands': ['mains', 'se laver', 'lavage', 'hygiène', 'wash hands'],
  'mi:checklist': ['liste', 'tâche', 'mission', 'todo', 'task'],
};

const fullMaterialIconCatalog: IconOption[] = materialSymbolNames.map((name) => ({
  value: `mi:${name}`,
  label: name.replaceAll('_', ' '),
  aliases: iconAliases[`mi:${name}`],
}));

function uniqueByValue(options: IconOption[]): IconOption[] {
  const map = new Map<string, IconOption>();

  for (const option of options) {
    if (!map.has(option.value)) {
      map.set(option.value, option);
    } else if (option.aliases?.length) {
      const existing = map.get(option.value);

      if (existing) {
        existing.aliases = [...new Set([...(existing.aliases ?? []), ...option.aliases])];
      }
    }
  }

  return Array.from(map.values());
}

export const choreIconOptions = uniqueByValue([...chorePriorityIcons, ...fullMaterialIconCatalog]);
export const rewardIconOptions = uniqueByValue([...rewardPriorityIcons, ...fullMaterialIconCatalog]);
