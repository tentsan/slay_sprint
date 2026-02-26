export const DEFAULT_CARDS = [
  {
    id: 'deal_5_damage',
    name: 'Deal 5 Damage',
    emoji: '⚔️',
    description: 'Deal 5 damage',
    type: 'attack',
    effects: [
      { target: 'enemy', action: 'damage', value: 5 }
    ]
  }
];

export const REWARD_CARDS = [
  {
    id: 'deal_3_damage',
    name: 'Quick Strike',
    emoji: '⚡',
    description: 'Deal 3 damage',
    type: 'attack',
    effects: [{ target: 'enemy', action: 'damage', value: 3 }]
  },
  {
    id: 'deal_7_damage',
    name: 'Heavy Slash',
    emoji: '🗡️',
    description: 'Deal 7 damage',
    type: 'attack',
    effects: [{ target: 'enemy', action: 'damage', value: 7 }]
  },
  {
    id: 'deal_10_damage',
    name: 'Power Strike',
    emoji: '💥',
    description: 'Deal 10 damage',
    type: 'attack',
    effects: [{ target: 'enemy', action: 'damage', value: 10 }]
  },
  {
    id: 'heal_5',
    name: 'Minor Heal',
    emoji: '💚',
    description: 'Heal 5 HP',
    type: 'heal',
    effects: [{ target: 'self', action: 'heal', value: 5 }]
  },
  {
    id: 'heal_10',
    name: 'Heal',
    emoji: '💖',
    description: 'Heal 10 HP',
    type: 'heal',
    effects: [{ target: 'self', action: 'heal', value: 10 }]
  },
  {
    id: 'deal_5_heal_3',
    name: 'Drain Strike',
    emoji: '🧛',
    description: 'Deal 5 damage, heal 3 HP',
    type: 'attack',
    effects: [
      { target: 'enemy', action: 'damage', value: 5 },
      { target: 'self', action: 'heal', value: 3 }
    ]
  },
];
