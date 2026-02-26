import { DEFAULT_CARDS } from './cards.js';

const TURN_DELAY_MS = 700;

export async function runBattle(player, enemy, onLog) {
  let turn = 0;
  enemy.maxHp = enemy.hp;

  onLog({ text: `Battle Start! ${player.name} vs ${enemy.name}`, type: 'info' });
  await delay(TURN_DELAY_MS);

  while (player.hp > 0 && enemy.hp > 0) {
    turn++;
    onLog({ text: `--- Turn ${turn} ---`, type: 'info' });
    await delay(300);

    // Player plays a card
    const playerCard = selectCard(player);
    playCard(player, enemy, playerCard, onLog);
    await delay(TURN_DELAY_MS);
    if (enemy.hp <= 0 || player.hp <= 0) break;

    // Enemy plays a card
    const enemyCard = selectCard(enemy);
    playCard(enemy, player, enemyCard, onLog);
    await delay(TURN_DELAY_MS);
    if (player.hp <= 0 || enemy.hp <= 0) break;
  }

  player.hp = Math.max(0, player.hp);
  enemy.hp = Math.max(0, enemy.hp);

  if (player.hp > 0) {
    onLog({ text: `${enemy.name} defeated!`, type: 'info' });
    return 'victory';
  } else {
    onLog({ text: `${player.name} has fallen...`, type: 'info' });
    return 'defeat';
  }
}

function selectCard(combatant) {
  const cards = combatant.cards?.length > 0 ? combatant.cards : DEFAULT_CARDS;
  return cards[Math.floor(Math.random() * cards.length)];
}

function playCard(user, opponent, card, onLog) {
  onLog({ text: `${user.name} played [${card.name}]!`, type: 'info' });

  for (const effect of (Array.isArray(card.effects) ? card.effects : [])) {
    const target = effect.target === 'self' ? user : opponent;
    resolveEffect(user, target, effect, onLog);
  }
}

function resolveEffect(user, target, effect, onLog) {
  switch (effect.action) {
    case 'damage': {
      const damage = Math.floor(Number(effect.value));
      if (!Number.isFinite(damage) || damage <= 0) break;
      target.hp -= damage;
      onLog({ text: `${target.name} takes ${damage} damage!`, type: 'damage' });
      break;
    }
    case 'heal': {
      const heal = Math.floor(Number(effect.value));
      if (!Number.isFinite(heal) || heal <= 0) break;
      const maxHp = target.max_hp || target.maxHp || 999;
      const healed = Math.min(heal, maxHp - target.hp);
      if (healed > 0) {
        target.hp += healed;
        onLog({ text: `${target.name} heals ${healed} HP!`, type: 'heal' });
      }
      break;
    }
    default:
      console.warn(`resolveEffect: unknown action "${effect.action}"`);
      break;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
