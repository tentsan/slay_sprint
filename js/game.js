import { runBattle } from './battle.js';
import { getRewardChoices, applyReward } from './reward.js';
import { Renderer } from './renderer.js';
import { DEFAULT_CARDS } from './cards.js';

const TOTAL_BATTLES = 10;

export class Game {
  constructor(enemies, rewards, playerBase) {
    this.enemies = enemies;
    this.rewards = rewards;
    this.playerBase = playerBase;
    this.renderer = new Renderer();
    this.state = 'loading';
    this.player = null;
    this.currentBattle = 0;
    this.currentEnemy = null;
    this.battleLog = [];
    this.isTransitioning = false;

    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('btn-start').addEventListener('click', () => {
      if (this.isTransitioning) return;
      this.startNewRun();
    });

    document.getElementById('btn-title').addEventListener('click', () => {
      if (this.isTransitioning) return;
      this.transition('title');
    });
  }

  transition(newState) {
    this.isTransitioning = true;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`screen-${newState}`);
    if (screen) screen.classList.add('active');
    this.state = newState;
    this.isTransitioning = false;
  }

  startNewRun() {
    this.player = { ...this.playerBase };
    this.player.hp = this.player.max_hp;
    this.player.cards = [...DEFAULT_CARDS];
    this.currentBattle = 0;
    this.startBattle();
  }

  selectEnemy(battleNumber) {
    const sorted = [...this.enemies].sort((a, b) => a.hp - b.hp);

    // Battle 10 (index 9): boss = hardest enemy
    if (battleNumber === TOTAL_BATTLES - 1) {
      return JSON.parse(JSON.stringify(sorted[sorted.length - 1]));
    }

    const tierSize = Math.ceil(sorted.length / 3);
    const tier = Math.min(Math.floor(battleNumber / 3), 2);
    const tierEnemies = sorted.slice(tier * tierSize, (tier + 1) * tierSize);
    const pick = tierEnemies[Math.floor(Math.random() * tierEnemies.length)];
    return JSON.parse(JSON.stringify(pick));
  }

  async startBattle() {
    this.currentEnemy = this.selectEnemy(this.currentBattle);
    this.battleLog = [];
    this.transition('battle');
    this.renderer.renderBattle(this.player, this.currentEnemy, this.currentBattle, TOTAL_BATTLES);
    this.renderer.clearBattleLog();

    // Small delay before battle starts
    await delay(600);

    const result = await runBattle(this.player, this.currentEnemy, (log) => {
      this.battleLog.push(log);
      this.renderer.appendBattleLog(log);
      this.renderer.updateHP(this.player, this.currentEnemy);
    });

    await delay(500);

    if (result === 'victory') {
      this.currentBattle++;
      if (this.currentBattle >= TOTAL_BATTLES) {
        this.showGameOver(true);
      } else {
        this.showRewards();
      }
    } else {
      this.showGameOver(false);
    }
  }

  showRewards() {
    const choices = getRewardChoices(this.rewards, 3);
    this.transition('reward');
    this.renderer.renderRewards(choices, (reward) => {
      if (this.isTransitioning) return;
      applyReward(this.player, reward);
      this.startBattle();
    });
  }

  showGameOver(isVictory) {
    this.transition('gameover');
    this.renderer.renderGameOver(isVictory, this.currentBattle, TOTAL_BATTLES, this.player);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
