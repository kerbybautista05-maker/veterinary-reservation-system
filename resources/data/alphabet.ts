// ============================================
// FILE: src/data/alphabet.ts
// Alphabet data for Severe Level
// ============================================

export interface AlphabetItem {
  letter: string;
  image: string;
  word: string;
  audio?: string;
  isVowel: boolean;
}

export const alphabetData: AlphabetItem[] = [
  { letter: 'A', image: '🍎', word: 'Apple', isVowel: true, audio: '/audio/alphabet/a.mp3' },
  { letter: 'B', image: '🎈', word: 'Balloon', isVowel: false, audio: '/audio/alphabet/b.mp3' },
  { letter: 'C', image: '🐱', word: 'Cat', isVowel: false, audio: '/audio/alphabet/c.mp3' },
  { letter: 'D', image: '🐕', word: 'Dog', isVowel: false, audio: '/audio/alphabet/d.mp3' },
  { letter: 'E', image: '🥚', word: 'Egg', isVowel: true, audio: '/audio/alphabet/e.mp3' },
  { letter: 'F', image: '🐸', word: 'Frog', isVowel: false, audio: '/audio/alphabet/f.mp3' },
  { letter: 'G', image: '🎸', word: 'Guitar', isVowel: false, audio: '/audio/alphabet/g.mp3' },
  { letter: 'H', image: '🏠', word: 'House', isVowel: false, audio: '/audio/alphabet/h.mp3' },
  { letter: 'I', image: '🍦', word: 'Ice cream', isVowel: true, audio: '/audio/alphabet/i.mp3' },
  { letter: 'J', image: '🃏', word: 'Joker', isVowel: false, audio: '/audio/alphabet/j.mp3' },
  { letter: 'K', image: '🔑', word: 'Key', isVowel: false, audio: '/audio/alphabet/k.mp3' },
  { letter: 'L', image: '🦁', word: 'Lion', isVowel: false, audio: '/audio/alphabet/l.mp3' },
  { letter: 'M', image: '🌙', word: 'Moon', isVowel: false, audio: '/audio/alphabet/m.mp3' },
  { letter: 'N', image: '🥜', word: 'Nut', isVowel: false, audio: '/audio/alphabet/n.mp3' },
  { letter: 'O', image: '🐙', word: 'Octopus', isVowel: true, audio: '/audio/alphabet/o.mp3' },
  { letter: 'P', image: '🍕', word: 'Pizza', isVowel: false, audio: '/audio/alphabet/p.mp3' },
  { letter: 'Q', image: '👸', word: 'Queen', isVowel: false, audio: '/audio/alphabet/q.mp3' },
  { letter: 'R', image: '🚀', word: 'Rocket', isVowel: false, audio: '/audio/alphabet/r.mp3' },
  { letter: 'S', image: '☀️', word: 'Sun', isVowel: false, audio: '/audio/alphabet/s.mp3' },
  { letter: 'T', image: '🚂', word: 'Train', isVowel: false, audio: '/audio/alphabet/t.mp3' },
  { letter: 'U', image: '☂️', word: 'Umbrella', isVowel: true, audio: '/audio/alphabet/u.mp3' },
  { letter: 'V', image: '🎻', word: 'Violin', isVowel: false, audio: '/audio/alphabet/v.mp3' },
  { letter: 'W', image: '🍉', word: 'Watermelon', isVowel: false, audio: '/audio/alphabet/w.mp3' },
  { letter: 'X', image: '📦', word: 'Box', isVowel: false, audio: '/audio/alphabet/x.mp3' },
  { letter: 'Y', image: '🧶', word: 'Yarn', isVowel: false, audio: '/audio/alphabet/y.mp3' },
  { letter: 'Z', image: '🦓', word: 'Zebra', isVowel: false, audio: '/audio/alphabet/z.mp3' },
];

export const getVowels = () => alphabetData.filter(item => item.isVowel);
export const getConsonants = () => alphabetData.filter(item => !item.isVowel);