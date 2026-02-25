import { parseCSV, parseKeyValueCSV } from './csv-parser.js';
import { Game } from './game.js';

async function init() {
  try {
    const [enemyText, rewardText, playerText] = await Promise.all([
      fetch('data/enemies.csv').then(r => r.text()),
      fetch('data/rewards.csv').then(r => r.text()),
      fetch('data/player.csv').then(r => r.text()),
    ]);

    const enemies = parseCSV(enemyText);
    const rewards = parseCSV(rewardText);
    const playerBase = parseKeyValueCSV(playerText);

    const game = new Game(enemies, rewards, playerBase);
    game.transition('title');
  } catch (err) {
    console.error('Failed to initialize game:', err);
    document.getElementById('screen-loading').querySelector('.loading-text').textContent =
      'Failed to load game data. Please use a local server (e.g. python3 -m http.server).';
  }
}

init();
