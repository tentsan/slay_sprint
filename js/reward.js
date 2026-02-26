/**
 * Pick N random cards from a card pool without duplicates.
 */
export function getCardChoices(cardPool, count = 3) {
  const shuffled = [...cardPool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Add a chosen card to the player's deck.
 */
export function applyCardReward(player, card) {
  player.cards.push(structuredClone(card));
}
