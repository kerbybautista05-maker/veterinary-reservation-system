// ============================================
// FILE: src/data/categories.ts
// Category data for Moderate Level
// ============================================

export interface CategoryItem {
  name: string;
  nameFilipino?: string;
  image: string;
  color: string;
  audio?: string;
  audioFilipino?: string;
}

export interface Category {
  id: string;
  name: string;
  nameFilipino: string;
  items: CategoryItem[];
}

// ANIMALS
export const animalsData: CategoryItem[] = [
  { name: 'PIG', nameFilipino: 'BABOY', image: '🐷', color: 'bg-pink-200', audio: '/audio/animals/pig.mp3' },
  { name: 'LION', nameFilipino: 'LEON', image: '🦁', color: 'bg-yellow-200', audio: '/audio/animals/lion.mp3' },
  { name: 'GIRAFFE', nameFilipino: 'HIRAPHE', image: '🦒', color: 'bg-orange-200', audio: '/audio/animals/giraffe.mp3' },
  { name: 'DOG', nameFilipino: 'ASO', image: '🐕', color: 'bg-blue-200', audio: '/audio/animals/dog.mp3' },
  { name: 'CROCODILE', nameFilipino: 'BUWAYA', image: '🐊', color: 'bg-green-200', audio: '/audio/animals/crocodile.mp3' },
  { name: 'CAT', nameFilipino: 'PUSA', image: '🐱', color: 'bg-gray-200', audio: '/audio/animals/cat.mp3' },
  { name: 'COW', nameFilipino: 'BAKA', image: '🐄', color: 'bg-yellow-100', audio: '/audio/animals/cow.mp3' },
  { name: 'ZEBRA', nameFilipino: 'SEBRA', image: '🦓', color: 'bg-gray-300', audio: '/audio/animals/zebra.mp3' },
];

// VEGETABLES
export const vegetablesData: CategoryItem[] = [
  { name: 'BROCCOLI', nameFilipino: 'BROKOLI', image: '🥦', color: 'bg-green-200', audio: '/audio/vegetables/broccoli.mp3' },
  { name: 'CARROT', nameFilipino: 'KAROT', image: '🥕', color: 'bg-orange-200', audio: '/audio/vegetables/carrot.mp3' },
  { name: 'TOMATO', nameFilipino: 'KAMATIS', image: '🍅', color: 'bg-red-200', audio: '/audio/vegetables/tomato.mp3' },
  { name: 'EGGPLANT', nameFilipino: 'TALONG', image: '🍆', color: 'bg-purple-200', audio: '/audio/vegetables/eggplant.mp3' },
  { name: 'CABBAGE', nameFilipino: 'REPOLYO', image: '🥬', color: 'bg-green-100', audio: '/audio/vegetables/cabbage.mp3' },
  { name: 'PUMPKIN', nameFilipino: 'KALABASA', image: '🎃', color: 'bg-orange-300', audio: '/audio/vegetables/pumpkin.mp3' },
  { name: 'MUSHROOM', nameFilipino: 'KABUTE', image: '🍄', color: 'bg-red-100', audio: '/audio/vegetables/mushroom.mp3' },
  { name: 'BELL PEPPER', nameFilipino: 'PAMINTA', image: '🫑', color: 'bg-red-200', audio: '/audio/vegetables/bell-pepper.mp3' },
];

// FRUITS
export const fruitsData: CategoryItem[] = [
  { name: 'APPLE', nameFilipino: 'MANSANAS', image: '🍎', color: 'bg-red-200', audio: '/audio/fruits/apple.mp3' },
  { name: 'BANANA', nameFilipino: 'SAGING', image: '🍌', color: 'bg-yellow-200', audio: '/audio/fruits/banana.mp3' },
  { name: 'ORANGE', nameFilipino: 'DALANDAN', image: '🍊', color: 'bg-orange-200', audio: '/audio/fruits/orange.mp3' },
  { name: 'GRAPES', nameFilipino: 'UBAS', image: '🍇', color: 'bg-purple-200', audio: '/audio/fruits/grapes.mp3' },
  { name: 'WATERMELON', nameFilipino: 'PAKWAN', image: '🍉', color: 'bg-green-200', audio: '/audio/fruits/watermelon.mp3' },
  { name: 'STRAWBERRY', nameFilipino: 'PRESA', image: '🍓', color: 'bg-red-100', audio: '/audio/fruits/strawberry.mp3' },
  { name: 'PINEAPPLE', nameFilipino: 'PINYA', image: '🍍', color: 'bg-yellow-300', audio: '/audio/fruits/pineapple.mp3' },
  { name: 'MANGO', nameFilipino: 'MANGGA', image: '🥭', color: 'bg-orange-300', audio: '/audio/fruits/mango.mp3' },
];

// SHAPES
export const shapesData: CategoryItem[] = [
  { name: 'CIRCLE', nameFilipino: 'BILOG', image: '⭕', color: 'bg-blue-200', audio: '/audio/shapes/circle.mp3' },
  { name: 'HEART', nameFilipino: 'PUSO', image: '💙', color: 'bg-pink-200', audio: '/audio/shapes/heart.mp3' },
  { name: 'TRIANGLE', nameFilipino: 'TATSULOK', image: '🔺', color: 'bg-blue-300', audio: '/audio/shapes/triangle.mp3' },
  { name: 'SQUARE', nameFilipino: 'PARISUKAT', image: '🟦', color: 'bg-blue-400', audio: '/audio/shapes/square.mp3' },
  { name: 'STAR', nameFilipino: 'BITUIN', image: '⭐', color: 'bg-yellow-200', audio: '/audio/shapes/star.mp3' },
  { name: 'RECTANGLE', nameFilipino: 'PARIHABA', image: '🟩', color: 'bg-green-300', audio: '/audio/shapes/rectangle.mp3' },
];

// VEHICLES
export const vehiclesData: CategoryItem[] = [
  { name: 'CAR', nameFilipino: 'KOTSE', image: '🚗', color: 'bg-blue-200', audio: '/audio/vehicles/car.mp3' },
  { name: 'BUS', nameFilipino: 'BUS', image: '🚌', color: 'bg-yellow-200', audio: '/audio/vehicles/bus.mp3' },
  { name: 'TRAIN', nameFilipino: 'TREN', image: '🚂', color: 'bg-red-200', audio: '/audio/vehicles/train.mp3' },
  { name: 'AIRPLANE', nameFilipino: 'EROPLANO', image: '✈️', color: 'bg-sky-200', audio: '/audio/vehicles/airplane.mp3' },
  { name: 'BOAT', nameFilipino: 'BANGKA', image: '⛵', color: 'bg-blue-300', audio: '/audio/vehicles/boat.mp3' },
  { name: 'BICYCLE', nameFilipino: 'BISIKLETA', image: '🚲', color: 'bg-green-200', audio: '/audio/vehicles/bicycle.mp3' },
];

// ALL CATEGORIES
export const categories: Category[] = [
  { id: 'animals', name: 'Animals', nameFilipino: 'Mga Hayop', items: animalsData },
  { id: 'vegetables', name: 'Vegetables', nameFilipino: 'Mga Gulay', items: vegetablesData },
  { id: 'fruits', name: 'Fruits', nameFilipino: 'Mga Prutas', items: fruitsData },
  { id: 'shapes', name: 'Shapes', nameFilipino: 'Mga Hugis', items: shapesData },
  { id: 'vehicles', name: 'Vehicles', nameFilipino: 'Mga Sasakyan', items: vehiclesData },
];