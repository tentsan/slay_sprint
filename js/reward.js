/**
 * Pick N random cards from a card pool without duplicates.
 */
export function getCardChoices(cardPool, count = 3) {
  const shuffled = [...cardPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Add a chosen card to the player's deck.
 */
export function applyCardReward(player, card) {
  player.cards.push(structuredClone(card));
}
