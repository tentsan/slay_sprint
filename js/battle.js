const TURN_DELAY_MS = 700;

export async function runBattle(player, enemy, onLog) {
  let turn = 0;

  // Reset temporary battle state
  player.statuses = [];
  enemy.statuses = [];
  enemy.maxHp = enemy.hp;

  // Save base stats so weaken/shield don't permanently alter them
  const playerBaseAttack = player.attack;
  const playerBaseDefense = player.defense;
  const enemyBaseAttack = enemy.attack;
  const enemyBaseDefense = enemy.defense;

  onLog({ text: `Battle Start! ${player.name} vs ${enemy.name}`, type: 'info' });
  await delay(TURN_DELAY_MS);

  while (player.hp > 0 && enemy.hp > 0) {
    turn++;
    onLog({ text: `--- Turn ${turn} ---`, type: 'info' });
    await delay(300);

    // Apply regen at start of turn
    if (player.regen > 0) {
      const healed = Math.min(player.regen, player.max_hp - player.hp);
      if (healed > 0) {
        player.hp += healed;
        onLog({ text: `${player.name} regenerates ${healed} HP`, type: 'heal' });
      }
    }

    // Apply status effects (poison, burn)
    await applyStatuses(player, 'player', onLog);
    if (player.hp <= 0) break;
    await applyStatuses(enemy, 'enemy', onLog);
    if (enemy.hp <= 0) break;

    // Determine action order by speed
    const playerFirst = player.speed >= enemy.speed;
    const first = playerFirst ? { attacker: player, defender: enemy, tag: 'player' }
                              : { attacker: enemy, defender: player, tag: 'enemy' };
    const second = playerFirst ? { attacker: enemy, defender: player, tag: 'enemy' }
                               : { attacker: player, defender: enemy, tag: 'player' };

    // First attacker acts
    await executeAttack(first.attacker, first.defender, first.tag, onLog);
    await delay(TURN_DELAY_MS);
    if (first.defender.hp <= 0 || first.attacker.hp <= 0) break;

    // Second attacker acts
    await executeAttack(second.attacker, second.defender, second.tag, onLog);
    await delay(TURN_DELAY_MS);
    if (second.defender.hp <= 0 || second.attacker.hp <= 0) break;
  }

  // Restore base stats so weaken/shield effects don't carry over
  player.attack = playerBaseAttack;
  player.defense = playerBaseDefense;
  enemy.attack = enemyBaseAttack;
  enemy.defense = enemyBaseDefense;

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

async function executeAttack(attacker, defender, attackerTag, onLog) {
  let rawDamage = attacker.attack;

  // Crit check (only player has crit stats)
  let isCrit = false;
  if (attacker.crit_chance && Math.random() < attacker.crit_chance) {
    rawDamage = Math.floor(rawDamage * (attacker.crit_multiplier || 1.5));
    isCrit = true;
  }

  // Apply defense
  const finalDamage = Math.max(1, rawDamage - defender.defense);
  defender.hp -= finalDamage;

  if (isCrit) {
    onLog({ text: `CRITICAL! ${attacker.name} deals ${finalDamage} damage to ${defender.name}!`, type: 'crit' });
  } else {
    onLog({ text: `${attacker.name} attacks ${defender.name} for ${finalDamage} damage`, type: 'damage' });
  }

  // Lifesteal (player permanent stat)
  if (attacker.lifesteal && attacker.lifesteal > 0) {
    const heal = Math.floor(finalDamage * attacker.lifesteal);
    if (heal > 0 && attacker.max_hp) {
      attacker.hp = Math.min(attacker.hp + heal, attacker.max_hp);
      onLog({ text: `${attacker.name} drains ${heal} HP`, type: 'heal' });
    }
  }

  // Thorns (defender reflects damage)
  if (defender.thorns && defender.thorns > 0) {
    attacker.hp -= defender.thorns;
    onLog({ text: `${attacker.name} takes ${defender.thorns} thorn damage!`, type: 'damage' });
  }

  // Enemy special ability (only if attacker survived thorns)
  if (attacker.hp > 0 && attacker.special && attacker.special_chance && Math.random() < attacker.special_chance) {
    await applySpecial(attacker, defender, onLog);
  }
}

async function applySpecial(attacker, defender, onLog) {
  const special = attacker.special;

  switch (special) {
    case 'poison':
      defender.statuses = defender.statuses || [];
      defender.statuses.push({ type: 'poison', damage: 3, turns: 3 });
      onLog({ text: `${attacker.name} poisons ${defender.name}! (3 dmg for 3 turns)`, type: 'special' });
      break;
    case 'burn':
      defender.statuses = defender.statuses || [];
      defender.statuses.push({ type: 'burn', damage: 4, turns: 2 });
      onLog({ text: `${attacker.name} burns ${defender.name}! (4 dmg for 2 turns)`, type: 'special' });
      break;
    case 'lifesteal': {
      const steal = Math.floor(attacker.attack * 0.5);
      const maxHp = attacker.maxHp || attacker.max_hp || 999;
      attacker.hp = Math.min(attacker.hp + steal, maxHp);
      onLog({ text: `${attacker.name} drains ${steal} HP!`, type: 'special' });
      break;
    }
    case 'weaken':
      defender.attack = Math.max(1, defender.attack - 2);
      onLog({ text: `${attacker.name} weakens ${defender.name}! (-2 ATK)`, type: 'special' });
      break;
    case 'shield': {
      const shieldVal = 5;
      attacker.defense += shieldVal;
      onLog({ text: `${attacker.name} raises a shield! (+${shieldVal} DEF)`, type: 'special' });
      break;
    }
    case 'drain': {
      const drainVal = 5;
      defender.hp -= drainVal;
      const maxHp = attacker.maxHp || attacker.max_hp || 999;
      attacker.hp = Math.min(attacker.hp + drainVal, maxHp);
      onLog({ text: `${attacker.name} drains ${drainVal} HP from ${defender.name}!`, type: 'special' });
      break;
    }
  }
}

async function applyStatuses(combatant, tag, onLog) {
  if (!combatant.statuses) return;

  combatant.statuses = combatant.statuses.filter(status => {
    if (status.turns <= 0) return false;

    if (status.type === 'poison' || status.type === 'burn') {
      combatant.hp -= status.damage;
      onLog({
        text: `${combatant.name} takes ${status.damage} ${status.type} damage`,
        type: 'damage'
      });
    }

    status.turns--;
    return status.turns > 0;
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
