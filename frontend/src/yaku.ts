// Simplified yaku (winning hand) detection for 2-player mahjong
import { Tile, Suit, tileKey } from './tiles';

export interface YakuResult {
  name: string;
  nameJp: string;
  han: number;
}

type TileCount = Record<string, number>;

function countTiles(hand: Tile[]): TileCount {
  const counts: TileCount = {};
  for (const t of hand) {
    const k = tileKey(t);
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

// Check if hand is a valid winning hand (4 melds + 1 pair = 14 tiles)
function canWinWithPair(counts: TileCount, pairKey: string): boolean {
  const c = { ...counts };
  c[pairKey] -= 2;
  if (c[pairKey] === 0) delete c[pairKey];
  return canFormMelds(c, 4);
}

function canFormMelds(counts: TileCount, needed: number): boolean {
  if (needed === 0) return Object.keys(counts).length === 0;

  // Find first tile
  const keys = Object.keys(counts).sort();
  if (keys.length === 0) return needed === 0;
  const key = keys[0];
  const [suit, valStr] = key.split('-');
  const val = parseInt(valStr);

  // Try triplet (kou)
  if (counts[key] >= 3) {
    const c = { ...counts };
    c[key] -= 3;
    if (c[key] === 0) delete c[key];
    if (canFormMelds(c, needed - 1)) return true;
  }

  // Try sequence (shun) - only for numbered suits
  if (suit === 'man' || suit === 'pin' || suit === 'sou') {
    const k2 = `${suit}-${val + 1}`;
    const k3 = `${suit}-${val + 2}`;
    if (counts[k2] && counts[k3]) {
      const c = { ...counts };
      c[key]--; if (c[key] === 0) delete c[key];
      c[k2]--; if (c[k2] === 0) delete c[k2];
      c[k3]--; if (c[k3] === 0) delete c[k3];
      if (canFormMelds(c, needed - 1)) return true;
    }
  }

  return false;
}

export function isWinningHand(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  const counts = countTiles(hand);

  // Standard form: 4 melds + 1 pair
  for (const key of Object.keys(counts)) {
    if (counts[key] >= 2) {
      if (canWinWithPair(counts, key)) return true;
    }
  }

  // Seven pairs (chitoitsu)
  if (Object.keys(counts).length === 7 && Object.values(counts).every(c => c === 2)) {
    return true;
  }

  return false;
}

export function detectYaku(hand: Tile[]): YakuResult[] {
  if (!isWinningHand(hand)) return [];

  const counts = countTiles(hand);
  const yakuList: YakuResult[] = [];

  const allKeys = Object.keys(counts);
  const isAllSimples = hand.every(t =>
    (t.suit === 'man' || t.suit === 'pin' || t.suit === 'sou') && t.value >= 2 && t.value <= 8
  );
  const hasOnlyTriplets = allKeys.every(k => counts[k] === 3 || counts[k] === 2);
  const isSevenPairs = allKeys.length === 7 && Object.values(counts).every(c => c === 2);
  const isAllHonors = hand.every(t => t.suit === 'wind' || t.suit === 'dragon');
  const isFlush = (() => {
    const numSuits = new Set(hand.filter(t => t.suit !== 'wind' && t.suit !== 'dragon').map(t => t.suit));
    return numSuits.size === 1;
  })();
  const hasHonors = hand.some(t => t.suit === 'wind' || t.suit === 'dragon');
  const isAllTerminals = hand.every(t =>
    (t.suit === 'wind' || t.suit === 'dragon') || t.value === 1 || t.value === 9
  );

  // Yakuman
  if (isAllHonors) {
    yakuList.push({ name: 'Tsuuiisou', nameJp: '字一色', han: 13 });
    return yakuList;
  }

  // Regular yaku
  if (isSevenPairs) {
    yakuList.push({ name: 'Chitoitsu', nameJp: '七対子', han: 2 });
  }
  if (isAllSimples) {
    yakuList.push({ name: 'Tanyao', nameJp: '断么九', han: 1 });
  }
  if (hasOnlyTriplets && !isSevenPairs) {
    yakuList.push({ name: 'Toitoi', nameJp: '対々和', han: 2 });
  }
  if (isFlush && !hasHonors) {
    yakuList.push({ name: 'Chinitsu', nameJp: '清一色', han: 6 });
  } else if (isFlush && hasHonors) {
    yakuList.push({ name: 'Honitsu', nameJp: '混一色', han: 3 });
  }
  if (isAllTerminals) {
    yakuList.push({ name: 'Honroutou', nameJp: '混老頭', han: 2 });
  }

  // Dragon triplets
  for (let d = 1; d <= 3; d++) {
    const dk = `dragon-${d}`;
    if (counts[dk] >= 3) {
      yakuList.push({ name: 'Yakuhai', nameJp: '役牌', han: 1 });
    }
  }

  // If no yaku found, give basic tsumo
  if (yakuList.length === 0) {
    yakuList.push({ name: 'Tsumo', nameJp: 'ツモ', han: 1 });
  }

  return yakuList;
}

export function calculateScore(yakuList: YakuResult[]): number {
  const totalHan = yakuList.reduce((sum, y) => sum + y.han, 0);
  // Simplified scoring
  if (totalHan >= 13) return 32000; // yakuman
  if (totalHan >= 6) return 12000;  // haneman
  if (totalHan >= 5) return 8000;   // mangan
  if (totalHan >= 4) return 6000;
  if (totalHan >= 3) return 4000;
  if (totalHan >= 2) return 2000;
  return 1000;
}
