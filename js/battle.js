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
  const playerBaseInt = player.int || 0;
  const playerBaseMen = player.men || 0;
  const enemyBaseAttack = enemy.attack;
  const enemyBaseDefense = enemy.defense;
  const enemyBaseInt = enemy.int || 0;
  const enemyBaseMen = enemy.men || 0;

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
  player.int = playerBaseInt;
  player.men = playerBaseMen;
  enemy.attack = enemyBaseAttack;
  enemy.defense = enemyBaseDefense;
  enemy.int = enemyBaseInt;
  enemy.men = enemyBaseMen;

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
  // Determine attack type
  let attackType;
  if (attackerTag === 'player') {
    // Player auto-selects: use magic if INT > ATK
    attackType = (attacker.int || 0) > attacker.attack ? 'magic' : 'physical';
  } else {
    // Enemy uses CSV-defined attack type
    attackType = attacker.attack_type || 'physical';
  }

  // Calculate raw damage based on attack type
  let rawDamage;
  let defStat;
  if (attackType === 'magic') {
    rawDamage = attacker.int || 0;
    defStat = defender.men || 0;
  } else {
    rawDamage = attacker.attack;
    defStat = defender.defense;
  }

  // Crit check (only player has crit stats)
  let isCrit = false;
  if (attacker.crit_chance && Math.random() < attacker.crit_chance) {
    rawDamage = Math.floor(rawDamage * (attacker.crit_multiplier || 1.5));
    isCrit = true;
  }

  // Apply defense
  const finalDamage = Math.max(1, rawDamage - defStat);
  defender.hp -= finalDamage;

  const tag = attackType === 'magic' ? '[Magic] ' : '[Physical] ';
  if (isCrit) {
    onLog({ text: `${tag}CRITICAL! ${attacker.name} deals ${finalDamage} damage to ${defender.name}!`, type: 'crit' });
  } else {
    onLog({ text: `${tag}${attacker.name} attacks ${defender.name} for ${finalDamage} damage`, type: 'damage' });
  }

  // Lifesteal (player permanent stat)
  if (attacker.lifesteal && attacker.lifesteal > 0) {
    const heal = Math.floor(finalDamage * attacker.lifesteal);
    if (heal > 0 && attacker.max_hp) {
      attacker.hp = Math.min(attacker.hp + heal, attacker.max_hp);
      onLog({ text: `${attacker.name} drains ${heal} HP`, type: 'heal' });
    }
  }

  // Thorns (defender reflects damage) — physical attacks only
  if (attackType === 'physical' && defender.thorns && defender.thorns > 0) {
    attacker.hp -= defender.thorns;
    onLog({ text: `${attacker.name} takes ${defender.thorns} thorn damage!`, type: 'damage' });
  }

  // Enemy special ability (only if attacker survived)
  if (attacker.hp > 0 && attacker.special && attacker.special_chance && Math.random() < attacker.special_chance) {
    await applySpecial(attacker, defender, attackerTag, onLog);
  }
}

async function applySpecial(attacker, defender, attackerTag, onLog) {
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
      // Use INT for magic attackers, ATK for physical
      const offStat = (attacker.attack_type === 'magic') ? (attacker.int || 0) : attacker.attack;
      const steal = Math.floor(offStat * 0.5);
      const maxHp = attacker.maxHp || attacker.max_hp || 999;
      attacker.hp = Math.min(attacker.hp + steal, maxHp);
      onLog({ text: `${attacker.name} drains ${steal} HP!`, type: 'special' });
      break;
    }
    case 'weaken': {
      // Reduce the stat the defender actually uses for attacking
      let defenderUsesMagic;
      if (attackerTag === 'enemy') {
        // Defender is player: check if player uses magic
        defenderUsesMagic = (defender.int || 0) > defender.attack;
      } else {
        // Defender is enemy: check attack_type
        defenderUsesMagic = defender.attack_type === 'magic';
      }
      if (defenderUsesMagic) {
        defender.int = Math.max(1, (defender.int || 0) - 2);
        onLog({ text: `${attacker.name} weakens ${defender.name}! (-2 INT)`, type: 'special' });
      } else {
        defender.attack = Math.max(1, defender.attack - 2);
        onLog({ text: `${attacker.name} weakens ${defender.name}! (-2 ATK)`, type: 'special' });
      }
      break;
    }
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
