// Mahjong tile definitions
// 34 unique tiles, 4 of each = 136 total

export type Suit = 'man' | 'pin' | 'sou' | 'wind' | 'dragon';

export interface Tile {
  suit: Suit;
  value: number; // 1-9 for man/pin/sou, 1-4 for wind (E/S/W/N), 1-3 for dragon (haku/hatsu/chun)
  id: number; // unique id 0-135
}

export const SUIT_NAMES: Record<Suit, string> = {
  man: '萬', pin: '筒', sou: '索', wind: '風', dragon: '三元',
};

export const TILE_NAMES: Record<string, string> = {
  'man-1': '一萬', 'man-2': '二萬', 'man-3': '三萬', 'man-4': '四萬', 'man-5': '五萬',
  'man-6': '六萬', 'man-7': '七萬', 'man-8': '八萬', 'man-9': '九萬',
  'pin-1': '一筒', 'pin-2': '二筒', 'pin-3': '三筒', 'pin-4': '四筒', 'pin-5': '五筒',
  'pin-6': '六筒', 'pin-7': '七筒', 'pin-8': '八筒', 'pin-9': '九筒',
  'sou-1': '一索', 'sou-2': '二索', 'sou-3': '三索', 'sou-4': '四索', 'sou-5': '五索',
  'sou-6': '六索', 'sou-7': '七索', 'sou-8': '八索', 'sou-9': '九索',
  'wind-1': '東', 'wind-2': '南', 'wind-3': '西', 'wind-4': '北',
  'dragon-1': '白', 'dragon-2': '發', 'dragon-3': '中',
};

// Unicode mahjong tiles (U+1F000 range)
export const TILE_EMOJI: Record<string, string> = {
  'man-1': '🀇', 'man-2': '🀈', 'man-3': '🀉', 'man-4': '🀊', 'man-5': '🀋',
  'man-6': '🀌', 'man-7': '🀍', 'man-8': '🀎', 'man-9': '🀏',
  'pin-1': '🀙', 'pin-2': '🀚', 'pin-3': '🀛', 'pin-4': '🀜', 'pin-5': '🀝',
  'pin-6': '🀞', 'pin-7': '🀟', 'pin-8': '🀠', 'pin-9': '🀡',
  'sou-1': '🀐', 'sou-2': '🀑', 'sou-3': '🀒', 'sou-4': '🀓', 'sou-5': '🀔',
  'sou-6': '🀕', 'sou-7': '🀖', 'sou-8': '🀗', 'sou-9': '🀘',
  'wind-1': '🀀', 'wind-2': '🀁', 'wind-3': '🀂', 'wind-4': '🀃',
  'dragon-1': '🀆', 'dragon-2': '🀅', 'dragon-3': '🀄',
};

export function tileKey(t: Tile): string {
  return `${t.suit}-${t.value}`;
}

export function tileEmoji(t: Tile): string {
  return TILE_EMOJI[tileKey(t)] || '🀫';
}

export function tileName(t: Tile): string {
  return TILE_NAMES[tileKey(t)] || '?';
}

export function createWall(): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;
  const suits: { suit: Suit; max: number }[] = [
    { suit: 'man', max: 9 }, { suit: 'pin', max: 9 }, { suit: 'sou', max: 9 },
    { suit: 'wind', max: 4 }, { suit: 'dragon', max: 3 },
  ];
  for (const { suit, max } of suits) {
    for (let v = 1; v <= max; v++) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({ suit, value: v, id: id++ });
      }
    }
  }
  return tiles;
}

export function shuffleWall(wall: Tile[]): Tile[] {
  const shuffled = [...wall];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sortHand(hand: Tile[]): Tile[] {
  const suitOrder: Record<Suit, number> = { man: 0, pin: 1, sou: 2, wind: 3, dragon: 4 };
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    return a.value - b.value;
  });
}
