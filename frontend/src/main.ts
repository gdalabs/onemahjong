import { GameState, initGame, playerDraw, playerDiscard, aiTurn } from './game';
import { tileEmoji, tileName, sortHand } from './tiles';

const PACKAGE_ID = '0x8e85a14d396a17f396af72577e44e579e761b988a66477219cecb4577c417c31';

let state: GameState = initGame();

function render() {
  const app = document.getElementById('app')!;
  const remaining = state.wall.length - state.wallIndex;

  app.innerHTML = `
    <div class="game-container">
      <header>
        <h1>🀄 OneMahjong</h1>
        <p class="subtitle">AI vs You — Full On-chain Mahjong on OneChain</p>
      </header>

      <div class="info-bar">
        <span>Turn: ${state.turnCount}</span>
        <span>Remaining: ${remaining} tiles</span>
        <span class="phase-badge">${phaseLabel(state.phase)}</span>
      </div>

      <div class="board">
        <!-- AI area -->
        <div class="ai-area">
          <h3>🤖 AI Hand</h3>
          <div class="hand ai-hand">
            ${state.aiHand.map(() =>
              state.phase === 'win' && state.winner === 'ai'
                ? '' // revealed below
                : '<span class="tile back">🀫</span>'
            ).join('')}
            ${state.phase === 'win' && state.winner === 'ai'
              ? state.aiHand.map(t => `<span class="tile revealed">${tileEmoji(t)}</span>`).join('')
              : ''
            }
          </div>
          <div class="discards">
            <span class="label">Discards:</span>
            ${state.aiDiscards.map(t => `<span class="tile small">${tileEmoji(t)}</span>`).join('')}
          </div>
        </div>

        <!-- Center message -->
        <div class="message-area">
          <p class="message ${state.phase === 'win' ? 'win-message' : ''}">${state.message}</p>
          ${state.phase === 'win' ? `
            <div class="result">
              <div class="yaku-list">
                ${state.yakuResult.map(y => `<span class="yaku-tag">${y.nameJp} (${y.han}翻)</span>`).join('')}
              </div>
              <p class="score">${state.score} points</p>
              <button onclick="window.newGame()">New Game</button>
            </div>
          ` : ''}
          ${state.phase === 'draw' ? `
            <button onclick="window.newGame()">New Game</button>
          ` : ''}
          ${state.phase === 'player_draw' ? `
            <button onclick="window.drawTile()" class="draw-btn">Draw Tile</button>
          ` : ''}
        </div>

        <!-- Player area -->
        <div class="player-area">
          <div class="discards">
            <span class="label">Discards:</span>
            ${state.playerDiscards.map(t => `<span class="tile small">${tileEmoji(t)}</span>`).join('')}
          </div>
          <h3>🧑 Your Hand</h3>
          <div class="hand player-hand">
            ${state.playerHand.map((t, i) => `
              <span class="tile ${state.phase === 'player_discard' ? 'clickable' : ''}"
                    onclick="window.discardTile(${i})"
                    title="${tileName(t)}">
                ${tileEmoji(t)}
              </span>
            `).join('')}
          </div>
        </div>
      </div>

      <footer>
        <p>Built on <a href="https://onelabs.cc" target="_blank">OneChain</a> |
        Contract: <code>${PACKAGE_ID.slice(0, 10)}...</code></p>
      </footer>
    </div>
  `;
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'player_draw': return '🎯 Your Draw';
    case 'player_discard': return '🎯 Your Discard';
    case 'ai_turn': return '🤖 AI Turn';
    case 'win': return '🏆 Game Over';
    case 'draw': return '🤝 Draw';
    default: return '';
  }
}

// Global functions for onclick
(window as any).drawTile = () => {
  state = playerDraw(state);
  render();

  // Auto-check: if player has winning hand after draw, phase is already 'win'
  // Otherwise, player needs to discard
};

(window as any).discardTile = (index: number) => {
  if (state.phase !== 'player_discard') return;
  state = playerDiscard(state, index);
  render();

  // AI takes turn after short delay
  setTimeout(() => {
    state = aiTurn(state);
    render();
  }, 500);
};

(window as any).newGame = () => {
  state = initGame();
  render();
};

render();
