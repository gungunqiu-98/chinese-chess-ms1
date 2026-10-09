// 车、马、象、士、王、炮、卒 【rook, horse, elephant, advisor, king, cannon, pawn】
export type Piece =
  | 'R'
  | 'H'
  | 'E'
  | 'A'
  | 'K'
  | 'C'
  | 'P'
  | 'r'
  | 'h'
  | 'e'
  | 'a'
  | 'k'
  | 'c'
  | 'p'
  | '';

export type Player = 'red' | 'black';

export type Board = Piece[][];

export interface Position {
  row: number;
  col: number;
}

export type GameSnapshot = {
  board: Board;
  currentPlayer: Player;
};
