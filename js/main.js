import { parseCSV, parseKeyValueCSV } from './csv-parser.js';
import { Game } from './game.js';

async function init() {
  try {
    const fetchText = (url) => fetch(url).then(r => {
      if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status} ${r.statusText}`);
      return r.text();
    });

    const [enemyText, playerText] = await Promise.all([
      fetchText('data/enemies.csv'),
      fetchText('data/player.csv'),
    ]);

    const enemies = parseCSV(enemyText);
    const playerBase = parseKeyValueCSV(playerText);

    const game = new Game(enemies, playerBase);
    game.transition('title');
  } catch (err) {
    console.error('Failed to initialize game:', err);
    document.getElementById('screen-loading').querySelector('.loading-text').textContent =
      'Failed to load game data. Please use a local server (e.g. python3 -m http.server).';
  }
}

init();
