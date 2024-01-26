import { nouns } from './nouns';
import { adjectives } from './adjectives';
import { verbs } from './verbs';

export const words = [...nouns, ...adjectives, ...verbs];

export const victoryMessages = [
  'Perfect',
  'Amazing',
  'Lovely',
  'Good job',
  'Nice',
  'Fantastic',
  'Bravo',
  'Splendid',
  'Stellar',
  'Awesome',
  'Great work',
  'Excellent',
  'Well done',
  'Super',
  'Way to go'
];

export const GAME_LOST = 'Sorry, play again? 🥺';
export const GAME_WON = 'YOU WIN! 🥳';

export const CORRECT_POSITION = 'green';
export const WRONG_POSITION = 'darkorange';
export const WRONG = 'black';
export const KEYBOARD_UNGUESSED_COLOR = 'grey';

export const keyboardRows = ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')];
