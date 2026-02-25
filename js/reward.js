/**
 * Pick N random rewards without duplicates.
 */
export function getRewardChoices(allRewards, count = 3) {
  const shuffled = [...allRewards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Apply a chosen reward to the player.
 */
export function applyReward(player, reward) {
  const value = Number(reward.value);

  if (reward.type === 'instant') {
    if (reward.stat === 'hp') {
      player.hp = Math.min(player.hp + value, player.max_hp);
    }
  } else if (reward.type === 'permanent') {
    if (reward.stat === 'max_hp') {
      player.max_hp += value;
      player.hp += value;
    } else {
      player[reward.stat] = (player[reward.stat] || 0) + value;
    }
  }
}
