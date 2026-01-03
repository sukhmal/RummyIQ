/**
 * Deck management for the Rummy game engine
 * Handles deck creation, shuffling, and dealing
 */

import {
  Card,
  Suit,
  Rank,
  SUITS,
  RANKS,
  CARDS_PER_PLAYER,
  PRINTED_JOKERS_PER_DECK,
  getCardValue,
} from './types';

/**
 * Generate a unique ID for a card
 */
const generateCardId = (suit: Suit, rank: Rank, deckIndex: number): string => {
  return `${suit}-${rank}-${deckIndex}`;
};

/**
 * Create a single standard deck of 52 cards plus printed jokers
 */
export const createDeck = (deckIndex: number = 0): Card[] => {
  const deck: Card[] = [];

  // Create standard 52 cards
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const card: Card = {
        id: generateCardId(suit, rank, deckIndex),
        suit,
        rank,
        jokerType: null,
        value: getCardValue({ suit, rank, jokerType: null } as Card),
      };
      deck.push(card);
    }
  }

  // Add printed jokers
  for (let i = 0; i < PRINTED_JOKERS_PER_DECK; i++) {
    const joker: Card = {
      id: `joker-${deckIndex}-${i}`,
      suit: 'spades', // Placeholder suit for jokers
      rank: 'A', // Placeholder rank for jokers
      jokerType: 'printed',
      value: 0,
    };
    deck.push(joker);
  }

  return deck;
};

/**
 * Create multiple decks for games
 * Indian Rummy always uses 2 decks (108 cards total including 4 jokers)
 * This ensures enough cards for dealing + draw pile
 */
export const createDecks = (_playerCount: number): Card[] => {
  const deckCount = 2; // Always use 2 decks for Indian Rummy
  const allCards: Card[] = [];

  for (let i = 0; i < deckCount; i++) {
    allCards.push(...createDeck(i));
  }

  return allCards;
};

/**
 * Fisher-Yates shuffle algorithm
 * Creates a new shuffled array without modifying the original
 */
export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Deal cards to players
 * Returns hands for each player and the remaining draw pile
 */
export interface DealResult {
  hands: { [playerId: string]: Card[] };
  drawPile: Card[];
  discardPile: Card[];
  wildJokerCard: Card | null;
}

export const dealCards = (
  deck: Card[],
  playerIds: string[],
  cardsPerPlayer: number = CARDS_PER_PLAYER
): DealResult => {
  const shuffledDeck = shuffle(deck);
  const hands: { [playerId: string]: Card[] } = {};
  let currentIndex = 0;

  // Initialize empty hands
  for (const playerId of playerIds) {
    hands[playerId] = [];
  }

  // Deal cards one at a time to each player (simulates real dealing)
  for (let cardNum = 0; cardNum < cardsPerPlayer; cardNum++) {
    for (const playerId of playerIds) {
      if (currentIndex < shuffledDeck.length) {
        hands[playerId].push(shuffledDeck[currentIndex]);
        currentIndex++;
      }
    }
  }

  // Pick wild joker card (first card after dealing)
  let wildJokerCard: Card | null = null;
  if (currentIndex < shuffledDeck.length) {
    const potentialWildCard = shuffledDeck[currentIndex];
    // Printed jokers can't be wild joker cards - keep drawing until we get a regular card
    if (potentialWildCard.jokerType !== 'printed') {
      wildJokerCard = potentialWildCard;
      currentIndex++;
    } else {
      // If printed joker, put it back and try next card
      for (let i = currentIndex; i < shuffledDeck.length; i++) {
        if (shuffledDeck[i].jokerType !== 'printed') {
          wildJokerCard = shuffledDeck[i];
          // Swap positions so the printed joker goes back in draw pile
          [shuffledDeck[currentIndex], shuffledDeck[i]] = [shuffledDeck[i], shuffledDeck[currentIndex]];
          currentIndex++;
          break;
        }
      }
    }
  }

  // Mark wild jokers in the deck (cards of same rank as wild joker card become wild jokers)
  const markWildJokers = (cards: Card[]): Card[] => {
    if (!wildJokerCard) return cards;
    return cards.map(card => {
      if (card.jokerType === 'printed') return card;
      if (card.rank === wildJokerCard!.rank && card.id !== wildJokerCard!.id) {
        return { ...card, jokerType: 'wild' as const, value: 0 };
      }
      return card;
    });
  };

  // Mark wild jokers in hands
  for (const playerId of playerIds) {
    hands[playerId] = markWildJokers(hands[playerId]);
  }

  // First card for discard pile (open card)
  const discardPile: Card[] = [];
  if (currentIndex < shuffledDeck.length) {
    discardPile.push(shuffledDeck[currentIndex]);
    currentIndex++;
  }

  // Remaining cards form the draw pile (also mark wild jokers)
  const drawPile = markWildJokers(shuffledDeck.slice(currentIndex));

  return {
    hands,
    drawPile,
    discardPile,
    wildJokerCard,
  };
};

/**
 * Draw a card from the draw pile
 * Returns the drawn card and the updated draw pile
 */
export const drawFromPile = (drawPile: Card[]): { card: Card | null; newPile: Card[] } => {
  if (drawPile.length === 0) {
    return { card: null, newPile: [] };
  }
  const [card, ...newPile] = drawPile;
  return { card, newPile };
};

/**
 * Draw from discard pile (pick up the top card)
 * Returns the drawn card and the updated discard pile
 */
export const drawFromDiscard = (discardPile: Card[]): { card: Card | null; newPile: Card[] } => {
  if (discardPile.length === 0) {
    return { card: null, newPile: [] };
  }
  const newPile = [...discardPile];
  const card = newPile.pop() || null;
  return { card, newPile };
};

/**
 * Add a card to the discard pile
 */
export const discardCard = (discardPile: Card[], card: Card): Card[] => {
  return [...discardPile, card];
};

/**
 * Check if the draw pile needs to be refilled from discard pile
 * (Keep the top discard card, shuffle the rest back into draw pile)
 */
export const refillDrawPile = (
  drawPile: Card[],
  discardPile: Card[]
): { newDrawPile: Card[]; newDiscardPile: Card[] } => {
  if (drawPile.length > 0 || discardPile.length <= 1) {
    return { newDrawPile: drawPile, newDiscardPile: discardPile };
  }

  // Keep top discard card
  const topDiscard = discardPile[discardPile.length - 1];
  const cardsToShuffle = discardPile.slice(0, -1);

  return {
    newDrawPile: shuffle(cardsToShuffle),
    newDiscardPile: [topDiscard],
  };
};

/**
 * Get card display info for UI
 */
export const getCardDisplay = (card: Card): { symbol: string; color: 'red' | 'black' } => {
  const suitSymbols: { [key in Suit]: string } = {
    hearts: '\u2665',
    diamonds: '\u2666',
    clubs: '\u2663',
    spades: '\u2660',
  };

  const color: 'red' | 'black' = card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black';

  if (card.jokerType === 'printed') {
    return { symbol: 'JOKER', color: 'red' };
  }

  return {
    symbol: `${card.rank}${suitSymbols[card.suit]}`,
    color,
  };
};
