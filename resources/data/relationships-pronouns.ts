// ============================================
// FILE: src/data/relationships.ts
// Relationships data for Moderate Level
// ============================================

export interface RelationshipItem {
  name: string;
  nameFilipino: string;
  image: string;
  color: string;
  audio?: string;
  category: 'family' | 'friends' | 'school';
  description?: string;
}

// FAMILY RELATIONSHIPS
export const familyRelationships: RelationshipItem[] = [
  {
    name: 'MOTHER',
    nameFilipino: 'INA',
    image: '👩',
    color: 'bg-pink-200',
    audio: '/audio/relationships/mother.mp3',
    category: 'family',
    description: 'Female parent'
  },
  {
    name: 'FATHER',
    nameFilipino: 'AMA',
    image: '👨',
    color: 'bg-blue-200',
    audio: '/audio/relationships/father.mp3',
    category: 'family',
    description: 'Male parent'
  },
  {
    name: 'SISTER',
    nameFilipino: 'KAPATID NA BABAE',
    image: '👧',
    color: 'bg-purple-200',
    audio: '/audio/relationships/sister.mp3',
    category: 'family',
    description: 'Female sibling'
  },
  {
    name: 'BROTHER',
    nameFilipino: 'KAPATID NA LALAKI',
    image: '👦',
    color: 'bg-green-200',
    audio: '/audio/relationships/brother.mp3',
    category: 'family',
    description: 'Male sibling'
  },
  {
    name: 'GRANDMOTHER',
    nameFilipino: 'LOLA',
    image: '👵',
    color: 'bg-yellow-200',
    audio: '/audio/relationships/grandmother.mp3',
    category: 'family',
    description: 'Mother\'s or father\'s mother'
  },
  {
    name: 'GRANDFATHER',
    nameFilipino: 'LOLO',
    image: '👴',
    color: 'bg-orange-200',
    audio: '/audio/relationships/grandfather.mp3',
    category: 'family',
    description: 'Mother\'s or father\'s father'
  },
  {
    name: 'AUNT',
    nameFilipino: 'TITA',
    image: '👩‍🦰',
    color: 'bg-red-200',
    audio: '/audio/relationships/aunt.mp3',
    category: 'family',
    description: 'Parent\'s sister'
  },
  {
    name: 'UNCLE',
    nameFilipino: 'TITO',
    image: '👨‍🦰',
    color: 'bg-teal-200',
    audio: '/audio/relationships/uncle.mp3',
    category: 'family',
    description: 'Parent\'s brother'
  }
];

// FRIENDS
export const friendsRelationships: RelationshipItem[] = [
  {
    name: 'FRIEND',
    nameFilipino: 'KAIBIGAN',
    image: '👫',
    color: 'bg-yellow-200',
    audio: '/audio/relationships/friend.mp3',
    category: 'friends',
    description: 'Close companion'
  },
  {
    name: 'BEST FRIEND',
    nameFilipino: 'MATALIK NA KAIBIGAN',
    image: '👭',
    color: 'bg-pink-300',
    audio: '/audio/relationships/best-friend.mp3',
    category: 'friends',
    description: 'Closest friend'
  },
  {
    name: 'CLASSMATE',
    nameFilipino: 'KAKLASE',
    image: '🧑‍🎓',
    color: 'bg-blue-300',
    audio: '/audio/relationships/classmate.mp3',
    category: 'friends',
    description: 'Person in same class'
  },
  {
    name: 'NEIGHBOR',
    nameFilipino: 'KAPITBAHAY',
    image: '🏘️',
    color: 'bg-green-300',
    audio: '/audio/relationships/neighbor.mp3',
    category: 'friends',
    description: 'Person living nearby'
  }
];

// SCHOOL RELATIONSHIPS
export const schoolRelationships: RelationshipItem[] = [
  {
    name: 'TEACHER',
    nameFilipino: 'GURO',
    image: '👨‍🏫',
    color: 'bg-blue-200',
    audio: '/audio/relationships/teacher.mp3',
    category: 'school',
    description: 'Person who teaches'
  },
  {
    name: 'PRINCIPAL',
    nameFilipino: 'PUNONG-GURO',
    image: '👔',
    color: 'bg-purple-200',
    audio: '/audio/relationships/principal.mp3',
    category: 'school',
    description: 'School head'
  },
  {
    name: 'LIBRARIAN',
    nameFilipino: 'BIBLIOTEKERO',
    image: '📚',
    color: 'bg-orange-200',
    audio: '/audio/relationships/librarian.mp3',
    category: 'school',
    description: 'Person in charge of library'
  },
  {
    name: 'COUNSELOR',
    nameFilipino: 'TAGAPAYO',
    image: '🗣️',
    color: 'bg-teal-200',
    audio: '/audio/relationships/counselor.mp3',
    category: 'school',
    description: 'Person who gives guidance'
  }
];

// ALL RELATIONSHIPS
export const allRelationships: RelationshipItem[] = [
  ...familyRelationships,
  ...friendsRelationships,
  ...schoolRelationships
];

export const getRelationshipsByCategory = (category: 'family' | 'friends' | 'school') => {
  return allRelationships.filter(rel => rel.category === category);
};

// ============================================
// FILE: src/data/pronouns.ts
// Pronouns data for Moderate Level
// ============================================

export interface PronounItem {
  pronoun: string;
  pronounFilipino: string;
  type: 'personal' | 'possessive' | 'demonstrative';
  example: string;
  exampleFilipino: string;
  audio?: string;
}

export const pronounsData: PronounItem[] = [
  // Personal Pronouns
  {
    pronoun: 'I',
    pronounFilipino: 'AKO',
    type: 'personal',
    example: 'I am happy',
    exampleFilipino: 'Ako ay masaya',
    audio: '/audio/pronouns/i.mp3'
  },
  {
    pronoun: 'YOU',
    pronounFilipino: 'IKAW',
    type: 'personal',
    example: 'You are kind',
    exampleFilipino: 'Ikaw ay mabait',
    audio: '/audio/pronouns/you.mp3'
  },
  {
    pronoun: 'HE',
    pronounFilipino: 'SIYA (lalaki)',
    type: 'personal',
    example: 'He is tall',
    exampleFilipino: 'Siya ay matangkad',
    audio: '/audio/pronouns/he.mp3'
  },
  {
    pronoun: 'SHE',
    pronounFilipino: 'SIYA (babae)',
    type: 'personal',
    example: 'She is smart',
    exampleFilipino: 'Siya ay matalino',
    audio: '/audio/pronouns/she.mp3'
  },
  {
    pronoun: 'WE',
    pronounFilipino: 'KAMI/TAYO',
    type: 'personal',
    example: 'We are friends',
    exampleFilipino: 'Kami ay magkakaibigan',
    audio: '/audio/pronouns/we.mp3'
  },
  {
    pronoun: 'THEY',
    pronounFilipino: 'SILA',
    type: 'personal',
    example: 'They are playing',
    exampleFilipino: 'Sila ay naglalaro',
    audio: '/audio/pronouns/they.mp3'
  },
  
  // Possessive Pronouns
  {
    pronoun: 'MY',
    pronounFilipino: 'AKING',
    type: 'possessive',
    example: 'My book',
    exampleFilipino: 'Aking libro',
    audio: '/audio/pronouns/my.mp3'
  },
  {
    pronoun: 'YOUR',
    pronounFilipino: 'IYONG',
    type: 'possessive',
    example: 'Your toy',
    exampleFilipino: 'Iyong laruan',
    audio: '/audio/pronouns/your.mp3'
  },
  {
    pronoun: 'HIS',
    pronounFilipino: 'KANYANG (lalaki)',
    type: 'possessive',
    example: 'His bag',
    exampleFilipino: 'Kanyang bag',
    audio: '/audio/pronouns/his.mp3'
  },
  {
    pronoun: 'HER',
    pronounFilipino: 'KANYANG (babae)',
    type: 'possessive',
    example: 'Her shoes',
    exampleFilipino: 'Kanyang sapatos',
    audio: '/audio/pronouns/her.mp3'
  },
  
  // Demonstrative Pronouns
  {
    pronoun: 'THIS',
    pronounFilipino: 'ITO',
    type: 'demonstrative',
    example: 'This is mine',
    exampleFilipino: 'Ito ay akin',
    audio: '/audio/pronouns/this.mp3'
  },
  {
    pronoun: 'THAT',
    pronounFilipino: 'IYAN/IYON',
    type: 'demonstrative',
    example: 'That is yours',
    exampleFilipino: 'Iyan ay iyo',
    audio: '/audio/pronouns/that.mp3'
  }
];

export const getPronounsByType = (type: 'personal' | 'possessive' | 'demonstrative') => {
  return pronounsData.filter(pronoun => pronoun.type === type);
};