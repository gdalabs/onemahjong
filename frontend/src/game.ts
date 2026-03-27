// 2-player mahjong game engine (Player vs AI)
import { Tile, createWall, shuffleWall, sortHand, tileKey, tileEmoji, tileName } from './tiles';
import { isWinningHand, detectYaku, calculateScore, YakuResult } from './yaku';

export type GamePhase = 'waiting' | 'player_draw' | 'player_discard' | 'ai_turn' | 'win' | 'draw';

export interface GameState {
  wall: Tile[];
  wallIndex: number;
  playerHand: Tile[];
  aiHand: Tile[];
  playerDiscards: Tile[];
  aiDiscards: Tile[];
  phase: GamePhase;
  turnCount: number;
  winner: 'player' | 'ai' | null;
  yakuResult: YakuResult[];
  score: number;
  message: string;
}

export function initGame(): GameState {
  const wall = shuffleWall(createWall());
  let idx = 0;

  // Deal 13 tiles each
  const playerHand: Tile[] = [];
  const aiHand: Tile[] = [];
  for (let i = 0; i < 13; i++) {
    playerHand.push(wall[idx++]);
    aiHand.push(wall[idx++]);
  }

  return {
    wall,
    wallIndex: idx,
    playerHand: sortHand(playerHand),
    aiHand: sortHand(aiHand),
    playerDiscards: [],
    aiDiscards: [],
    phase: 'player_draw',
    turnCount: 0,
    winner: null,
    yakuResult: [],
    score: 0,
    message: 'Your turn! Draw a tile.',
  };
}

export function playerDraw(state: GameState): GameState {
  if (state.phase !== 'player_draw') return state;
  if (state.wallIndex >= state.wall.length) {
    return { ...state, phase: 'draw', message: 'No more tiles. Draw game!' };
  }

  const tile = state.wall[state.wallIndex];
  const newHand = sortHand([...state.playerHand, tile]);

  // Check tsumo (self-draw win)
  if (isWinningHand(newHand)) {
    const yaku = detectYaku(newHand);
    const score = calculateScore(yaku);
    return {
      ...state,
      wallIndex: state.wallIndex + 1,
      playerHand: newHand,
      phase: 'win',
      winner: 'player',
      yakuResult: yaku,
      score,
      message: `Tsumo! You win! ${yaku.map(y => y.nameJp).join(', ')} — ${score} points`,
    };
  }

  return {
    ...state,
    wallIndex: state.wallIndex + 1,
    playerHand: newHand,
    phase: 'player_discard',
    message: `Drew ${tileName(tile)} ${tileEmoji(tile)}. Choose a tile to discard.`,
  };
}

export function playerDiscard(state: GameState, tileIndex: number): GameState {
  if (state.phase !== 'player_discard') return state;
  if (tileIndex < 0 || tileIndex >= state.playerHand.length) return state;

  const discarded = state.playerHand[tileIndex];
  const newHand = [...state.playerHand];
  newHand.splice(tileIndex, 1);

  return {
    ...state,
    playerHand: sortHand(newHand),
    playerDiscards: [...state.playerDiscards, discarded],
    phase: 'ai_turn',
    turnCount: state.turnCount + 1,
    message: `Discarded ${tileName(discarded)}. AI is thinking...`,
  };
}

export function aiTurn(state: GameState): GameState {
  if (state.phase !== 'ai_turn') return state;
  if (state.wallIndex >= state.wall.length) {
    return { ...state, phase: 'draw', message: 'No more tiles. Draw game!' };
  }

  // AI draws
  const tile = state.wall[state.wallIndex];
  const aiHandWithDraw = [...state.aiHand, tile];

  // Check if AI wins
  if (isWinningHand(aiHandWithDraw)) {
    const yaku = detectYaku(aiHandWithDraw);
    const score = calculateScore(yaku);
    return {
      ...state,
      wallIndex: state.wallIndex + 1,
      aiHand: sortHand(aiHandWithDraw),
      phase: 'win',
      winner: 'ai',
      yakuResult: yaku,
      score,
      message: `AI wins with Tsumo! ${yaku.map(y => y.nameJp).join(', ')} — ${score} points`,
    };
  }

  // AI discards (simple strategy: discard most isolated tile)
  const discardIdx = aiChooseDiscard(aiHandWithDraw);
  const discarded = aiHandWithDraw[discardIdx];
  aiHandWithDraw.splice(discardIdx, 1);

  return {
    ...state,
    wallIndex: state.wallIndex + 1,
    aiHand: sortHand(aiHandWithDraw),
    aiDiscards: [...state.aiDiscards, discarded],
    phase: 'player_draw',
    message: `AI discarded ${tileName(discarded)} ${tileEmoji(discarded)}. Your turn!`,
  };
}

// Simple AI: discard the most isolated tile
function aiChooseDiscard(hand: Tile[]): number {
  let bestIdx = 0;
  let bestScore = Infinity;

  for (let i = 0; i < hand.length; i++) {
    const t = hand[i];
    let connectedness = 0;

    for (let j = 0; j < hand.length; j++) {
      if (i === j) continue;
      const o = hand[j];
      if (t.suit === o.suit) {
        if (t.value === o.value) connectedness += 10; // pair
        else if (Math.abs(t.value - o.value) === 1) connectedness += 5; // adjacent
        else if (Math.abs(t.value - o.value) === 2) connectedness += 2; // gap
      }
    }

    if (connectedness < bestScore) {
      bestScore = connectedness;
      bestIdx = i;
    }
  }

  return bestIdx;
}
