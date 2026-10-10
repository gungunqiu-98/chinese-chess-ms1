/**
 * interface 和 type的区别
 * 1. interface 声明合并：同名会自动合并成员。前提是成员不冲突，冲突会报错。
 *    type 同名就会报错，与类型是否相同无关。
 * 2. type 可以表达：联合类型Plaryer、数组别名Board、元组、映射类型/条件类型；对象结构 Position GameSnapshot
 *    interface表达：对象结构、声明合并
 */

// 棋子：车、马、象、士、王、炮、卒 【rook, horse, elephant, advisor, king, cannon, pawn】
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

// 棋方  
export type Player = 'red' | 'black';

// 棋盘
export type Board = Piece[][];

//棋子位置
export interface Position {
  row: number;
  col: number;
}

// 历史快照
export type GameSnapshot = {
  board: Board;
  currentPlayer: Player;
};

// 对局状态。
// 注意象棋与国象的关键差异：将死（被将军且无棋可走）和困毙（未被将军但无棋可走）
// 都算「轮到走棋的一方输」，没有和棋。本阶段不实现 60 回合、重复局面、长将等和棋规则。
export type GameStatus = 'playing' | 'red-win' | 'black-win';
