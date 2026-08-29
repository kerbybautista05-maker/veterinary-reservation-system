// ============================================
// FILE: src/data/figurativeLanguage.ts
// Figurative Language lessons for Mild Level
// ============================================

export interface Lesson {
  id: string;
  title: string;
  titleFilipino: string;
  definition: string;
  definitionFilipino: string;
  examples: string[];
  examplesFilipino: string[];
  audio?: string;
}

export const figurativeLanguageLessons: Record<string, Lesson> = {
  simile: {
    id: 'simile',
    title: 'SIMILE',
    titleFilipino: 'SIMILE',
    definition: 'Is a figure of speech in which two essentially dissimilar objects or concepts are expressly compared with one another through the use of "like" or "as," more...',
    definitionFilipino: 'Ang simile ay isang tayutay na ginagamit ang "tulad ng" o "parang" upang ihambing ang dalawang magkaibang bagay.',
    examples: [
      'As brave as a lion',
      'As busy as a bee',
      'Like a shining star',
      'Fast like lightning',
      'Sweet as sugar'
    ],
    examplesFilipino: [
      'Matapang na parang leon',
      'Abala na parang bubuyog',
      'Tulad ng nagniningning na bituin',
      'Mabilis na parang kidlat',
      'Matamis na parang asukal'
    ],
    audio: '/audio/lessons/simile.mp3'
  },
  
  metaphor: {
    id: 'metaphor',
    title: 'METAPHOR',
    titleFilipino: 'METAPORA',
    definition: 'A figure of speech that makes a comparison between two unlike things without using "like" or "as". It states that one thing is another thing.',
    definitionFilipino: 'Ang metapora ay isang tayutay na direktang nagsasabing ang isang bagay ay isa pang bagay, nang hindi gumagamit ng "tulad ng" o "parang".',
    examples: [
      'Time is money',
      'He is a night owl',
      'Life is a journey',
      'The world is a stage',
      'Her eyes were diamonds'
    ],
    examplesFilipino: [
      'Ang oras ay salapi',
      'Siya ay isang gabi-gabing ibon',
      'Ang buhay ay isang paglalakbay',
      'Ang mundo ay isang entablado',
      'Ang kanyang mga mata ay mga dyamante'
    ],
    audio: '/audio/lessons/metaphor.mp3'
  },
  
  personification: {
    id: 'personification',
    title: 'PERSONIFICATION',
    titleFilipino: 'PERSONIPIKASYON',
    definition: 'Giving human characteristics, qualities, or actions to non-human things, animals, or abstract ideas.',
    definitionFilipino: 'Ang pagbibigay ng katangian, gawi, o kilos ng tao sa mga bagay, hayop, o ideya na hindi tao.',
    examples: [
      'The wind whispered through the trees',
      'The sun smiled down on us',
      'Time flies when you\'re having fun',
      'The flowers danced in the breeze',
      'The moon watched over the sleeping city'
    ],
    examplesFilipino: [
      'Ang hangin ay bumubullong sa mga puno',
      'Ang araw ay ngumiti sa amin',
      'Ang oras ay lumilipad kapag masaya ka',
      'Ang mga bulaklak ay sumasayaw sa simoy',
      'Ang buwan ay nagbabantay sa natutulog na lungsod'
    ],
    audio: '/audio/lessons/personification.mp3'
  },
  
  assonance: {
    id: 'assonance',
    title: 'ASSONANCE',
    titleFilipino: 'ASONANSYA',
    definition: 'The repetition of vowel sounds in nearby words. It creates a musical or rhythmic effect in poetry and prose.',
    definitionFilipino: 'Ang pag-uulit ng tunog ng mga patinig sa magkalapit na mga salita. Lumilikha ito ng musikal na epekto.',
    examples: [
      'The rain in Spain stays mainly in the plain',
      'Go slow over the road',
      'Fleet feet sweep by sleeping geese',
      'Hear the mellow wedding bells',
      'I must confess that in my quest I felt depressed'
    ],
    examplesFilipino: [
      'Ang ulan sa bundok ay tumatagos sa bubong',
      'Ang mata ng bata ay kumukurap-kurap',
      'Ang malamig na hangin ay humahaplos sa dahon',
      'Kumakanta ang ibon sa umaga',
      'Ang magandang tanghali ay dumaan na'
    ],
    audio: '/audio/lessons/assonance.mp3'
  },
  
  onomatopoeia: {
    id: 'onomatopoeia',
    title: 'ONOMATOPOEIA',
    titleFilipino: 'ONOMATOPEYA',
    definition: 'Words that imitate or suggest the sound they describe. These words sound like what they mean.',
    definitionFilipino: 'Mga salitang tumutunog tulad ng bagay o aksyon na kanilang inilarawan. Ang tunog ng salita ay katulad ng tunay na tunog.',
    examples: [
      'The bee buzzed around the flower',
      'The snake hissed at the intruder',
      'Boom! The fireworks exploded',
      'Splash! He jumped into the pool',
      'The cat meowed loudly'
    ],
    examplesFilipino: [
      'Ang bubuyog ay bumuzing sa paligid ng bulaklak',
      'Ang ahas ay sumisingising',
      'Kabog! Sumabog ang paputok',
      'Kulog! Bumagsak ang kidlat',
      'Ang pusa ay umingaw nang malakas'
    ],
    audio: '/audio/lessons/onomatopoeia.mp3'
  }
};

// Sentence Construction Data
export interface SentencePattern {
  id: string;
  pattern: string;
  patternFilipino: string;
  examples: string[];
  examplesFilipino: string[];
  description: string;
}

export const sentencePatterns: SentencePattern[] = [
  {
    id: 'subject-verb',
    pattern: 'Subject + Verb',
    patternFilipino: 'Simuno + Pandiwa',
    examples: [
      'The dog barks',
      'She runs',
      'Birds fly'
    ],
    examplesFilipino: [
      'Ang aso ay tumatahol',
      'Siya ay tumatakbo',
      'Ang mga ibon ay lumilipad'
    ],
    description: 'Basic sentence structure with subject and action'
  },
  {
    id: 'subject-verb-object',
    pattern: 'Subject + Verb + Object',
    patternFilipino: 'Simuno + Pandiwa + Layon',
    examples: [
      'The cat caught the mouse',
      'She reads books',
      'I eat breakfast'
    ],
    examplesFilipino: [
      'Ang pusa ay nahuli ang daga',
      'Siya ay nagbabasa ng mga libro',
      'Ako ay kumakain ng almusal'
    ],
    description: 'Sentence with subject performing action on object'
  },
  {
    id: 'subject-verb-adjective',
    pattern: 'Subject + Verb + Adjective',
    patternFilipino: 'Simuno + Pandiwa + Pang-uri',
    examples: [
      'The sky is blue',
      'She feels happy',
      'The flower smells sweet'
    ],
    examplesFilipino: [
      'Ang langit ay asul',
      'Siya ay masaya',
      'Ang bulaklak ay mabango'
    ],
    description: 'Sentence describing a quality or state'
  }
];

// Terminology/Vocabulary Data
export interface TerminologyItem {
  term: string;
  termFilipino: string;
  definition: string;
  definitionFilipino: string;
  example: string;
  exampleFilipino: string;
}

export const terminologyData: TerminologyItem[] = [
  {
    term: 'Noun',
    termFilipino: 'Pangngalan',
    definition: 'A word that names a person, place, thing, or idea',
    definitionFilipino: 'Salitang tumutukoy sa tao, lugar, bagay, o ideya',
    example: 'dog, city, happiness',
    exampleFilipino: 'aso, lungsod, kaligayahan'
  },
  {
    term: 'Verb',
    termFilipino: 'Pandiwa',
    definition: 'A word that expresses an action or state of being',
    definitionFilipino: 'Salitang nagsasaad ng kilos o estado',
    example: 'run, is, jump',
    exampleFilipino: 'tumakbo, ay, tumalon'
  },
  {
    term: 'Adjective',
    termFilipino: 'Pang-uri',
    definition: 'A word that describes or modifies a noun',
    definitionFilipino: 'Salitang naglalarawan sa pangngalan',
    example: 'beautiful, big, red',
    exampleFilipino: 'maganda, malaki, pula'
  },
  {
    term: 'Adverb',
    termFilipino: 'Pang-abay',
    definition: 'A word that modifies a verb, adjective, or another adverb',
    definitionFilipino: 'Salitang naglalarawan sa pandiwa, pang-uri, o pang-abay',
    example: 'quickly, very, always',
    exampleFilipino: 'mabilis, napaka, lagi'
  }
];