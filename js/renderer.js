export class Renderer {
  constructor() {
    this.els = {
      battleCount: document.getElementById('battle-count'),
      playerName: document.getElementById('player-name'),
      playerEmoji: document.getElementById('player-emoji'),
      playerHpBar: document.getElementById('player-hp-bar'),
      playerHpText: document.getElementById('player-hp-text'),
      playerStats: document.getElementById('player-stats'),
      playerDamageAnchor: document.getElementById('player-damage-anchor'),
      enemyName: document.getElementById('enemy-name'),
      enemyEmoji: document.getElementById('enemy-emoji'),
      enemyHpBar: document.getElementById('enemy-hp-bar'),
      enemyHpText: document.getElementById('enemy-hp-text'),
      enemyStats: document.getElementById('enemy-stats'),
      enemyDamageAnchor: document.getElementById('enemy-damage-anchor'),
      battleLog: document.getElementById('battle-log'),
      rewardCards: document.getElementById('reward-cards'),
      gameoverTitle: document.getElementById('gameover-title'),
      gameoverSubtitle: document.getElementById('gameover-subtitle'),
      gameoverStats: document.getElementById('gameover-stats'),
    };
  }

  renderBattle(player, enemy, battleIndex, totalBattles) {
    this.els.battleCount.textContent = `Battle ${battleIndex + 1} / ${totalBattles}`;
    this.els.playerName.textContent = player.name;
    this.els.playerEmoji.textContent = player.emoji;
    this.els.enemyName.textContent = enemy.name;
    this.els.enemyEmoji.textContent = enemy.emoji;

    this.updateHP(player, enemy);
    this.els.playerStats.textContent = '';
    this.els.enemyStats.textContent = '';
  }

  updateHP(player, enemy) {
    const playerPct = Math.max(0, (player.hp / player.max_hp) * 100);
    const enemyMaxHp = enemy.maxHp || enemy.hp;
    const enemyPct = Math.max(0, (enemy.hp / enemyMaxHp) * 100);

    this.els.playerHpBar.style.width = `${playerPct}%`;
    this.els.playerHpText.textContent = `${Math.max(0, player.hp)} / ${player.max_hp}`;

    this.els.enemyHpBar.style.width = `${enemyPct}%`;
    this.els.enemyHpText.textContent = `${Math.max(0, enemy.hp)} / ${enemyMaxHp}`;
  }

  clearBattleLog() {
    this.els.battleLog.innerHTML = '';
  }

  appendBattleLog(log) {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${log.type}`;
    entry.textContent = log.text;
    this.els.battleLog.appendChild(entry);
    // Auto-scroll to bottom
    this.els.battleLog.parentElement.scrollTop = this.els.battleLog.parentElement.scrollHeight;
  }

  renderRewards(choices, onSelect) {
    this.els.rewardCards.innerHTML = '';
    this.els.rewardCards.style.pointerEvents = '';
    let hasSelected = false;
    choices.forEach(reward => {
      const card = document.createElement('button');
      card.className = 'reward-card';

      const emoji = document.createElement('div');
      emoji.className = 'reward-card-emoji';
      emoji.textContent = reward.emoji;

      const name = document.createElement('div');
      name.className = 'reward-card-name';
      name.textContent = reward.name;

      const desc = document.createElement('div');
      desc.className = 'reward-card-desc';
      desc.textContent = reward.description;

      card.append(emoji, name, desc);
      card.addEventListener('click', () => {
        if (hasSelected) return;
        hasSelected = true;
        this.els.rewardCards.style.pointerEvents = 'none';
        onSelect(reward);
      });
      this.els.rewardCards.appendChild(card);
    });
  }

  renderGameOver(isVictory, battlesCompleted, totalBattles, player) {
    const titleEl = this.els.gameoverTitle;
    const subtitleEl = this.els.gameoverSubtitle;
    const statsEl = this.els.gameoverStats;

    if (isVictory) {
      titleEl.textContent = 'VICTORY!';
      titleEl.className = 'gameover-title victory';
      subtitleEl.textContent = 'You conquered all battles!';
    } else {
      titleEl.textContent = 'GAME OVER';
      titleEl.className = 'gameover-title defeat';
      subtitleEl.textContent = `Defeated at battle ${battlesCompleted + 1} of ${totalBattles}`;
    }

    statsEl.innerHTML = `
      Battles Cleared: ${battlesCompleted} / ${totalBattles}<br>
      Max HP: ${player.max_hp}
    `;
  }
}
