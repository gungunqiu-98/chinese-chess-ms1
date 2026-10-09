import type { Piece } from './types';

export const colNum = 9;
export const rowNum = 10;
export const cell_size = 58;
export const offset_top = 33;

export const piece_labels: Record<Piece, string> = {
  R: '车',
  H: '马',
  E: '象',
  A: '士',
  K: '帅',
  C: '炮',
  P: '兵',
  r: '车',
  h: '马',
  e: '象',
  a: '士',
  k: '将',
  c: '炮',
  p: '卒',
  '': '',
};

export const COLORS = {
  red: '#c00',
  black: '#000',
} as const;
