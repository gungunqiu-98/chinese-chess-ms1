/*
  象棋走子规则的核心

  分成两层，是为了避免「判断将的安全时又要判断将的安全」的无限递归：

  1. genPseudoMoves  生成「形状上合法」的走法：马走日、象走田、炮翻山、
                     九宫限制、过河限制、路径阻挡、不吃己方子。
                     它不检查走完之后自己的将是否会被将军 —— 这是基础层。
  2. isKingInCheck   判断某个将是否正被攻击。基于对方的 genPseudoMoves，不再往下递归。
                     所以必须先有第 1 层，第 2 层才成立。
  3. genLegalMoves   真正的合法走法 = 伪合法走法 - 走完后自己被将军的走法。

  胜负判定建在第 3 层之上：轮到走棋的一方如果一步合法走法都没有，
  无论被将死（被将军）还是被困毙（未被将军），在象棋里都判【负】。
*/
import { colNum, rowNum } from './constants';
import type { Board, GameStatus, Piece, Player, Position } from './types';

export const initBoard = (): Board => [
  ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'],
  ['', '', '', '', '', '', '', '', ''],
  ['', 'C', '', '', '', '', '', 'C', ''],
  ['P', '', 'P', '', 'P', '', 'P', '', 'P'],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['p', '', 'p', '', 'p', '', 'p', '', 'p'],
  ['', 'c', '', '', '', '', '', 'c', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r'],
];

// 检查位置是否在棋盘内
export const isInBounds = (pos: Position): boolean =>
  pos.row >= 0 && pos.row < rowNum && pos.col >= 0 && pos.col < colNum;

// 获取棋子所属玩家
export const getPiecePlayer = (piece: Piece): Player | null => {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'red' : 'black';
};

// 检查两个位置是否为同色棋子
export const isSameColor = (a: Piece, b: Piece): boolean => {
  const pa = getPiecePlayer(a);
  const pb = getPiecePlayer(b);
  return !!pa && pa === pb;
};

// 克隆棋盘
export const cloneBoard = (board: Board): Board => board.map((row) => [...row]);

// 检查位置是否在红方 palace（九宫）内
const getRedPalace = (pos: Position): boolean =>
  pos.row >= 0 && pos.row <= 2 && pos.col >= 3 && pos.col <= 5;

// 检查位置是否在黑方 palace（九宫）内
const getBlackPalace = (pos: Position): boolean =>
  pos.row >= 7 && pos.row <= 9 && pos.col >= 3 && pos.col <= 5;

// 检查位置是否在对应玩家的 palace 内
const isInPalace = (player: Player, pos: Position): boolean =>
  player === 'red' ? getRedPalace(pos) : getBlackPalace(pos);

// 查找指定玩家的王的位置
const findKing = (board: Board, player: Player): Position | null => {
  const kingPiece: Piece = player === 'red' ? 'K' : 'k';
  for (let row = 0; row < rowNum; row++) {
    for (let col = 0; col < colNum; col++) {
      if (board[row][col] === kingPiece) return { row, col };
    }
  }
  return null;
};

// 检查红方王和黑方王是否面对面（白脸将）
const areKingsFacing = (board: Board): boolean => {
  const redKing = findKing(board, 'red');
  const blackKing = findKing(board, 'black');
  if (!redKing || !blackKing) return false;
  if (redKing.col !== blackKing.col) return false;
  const col = redKing.col;
  const start = Math.min(redKing.row, blackKing.row) + 1;
  const end = Math.max(redKing.row, blackKing.row) - 1;
  for (let row = start; row <= end; row++) {
    if (board[row][col]) return false;
  }
  return true;
};

// 应用移动到新棋盘
export const applyMove = (board: Board, from: Position, to: Position): Board => {
  const next = cloneBoard(board);
  next[to.row][to.col] = next[from.row][from.col];
  next[from.row][from.col] = '';
  return next;
};

// 生成直线移动
const genLineMoves = (
  board: Board,
  from: Position,
  deltas: Array<[number, number]>,
): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const player = getPiecePlayer(piece);
  if (!player) return [];

  const moves: Position[] = [];
  for (const [dr, dc] of deltas) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (isInBounds({ row: r, col: c })) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (!isSameColor(piece, target)) moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
};

// 生成炮移动
const genCannonMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const deltas: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (const [dr, dc] of deltas) {
    let r = from.row + dr;
    let c = from.col + dc;
    let jumped = false;

    while (isInBounds({ row: r, col: c })) {
      const target = board[r][c];

      if (!jumped) {
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          jumped = true;
        }
      } else {
        if (target) {
          if (!isSameColor(piece, target)) moves.push({ row: r, col: c });
          break;
        }
      }

      r += dr;
      c += dc;
    }
  }

  return moves;
};

// 生成马移动
const genHorseMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const candidates: Array<{ to: Position; leg: Position }> = [
    { to: { row: from.row - 2, col: from.col - 1 }, leg: { row: from.row - 1, col: from.col } },
    { to: { row: from.row - 2, col: from.col + 1 }, leg: { row: from.row - 1, col: from.col } },
    { to: { row: from.row + 2, col: from.col - 1 }, leg: { row: from.row + 1, col: from.col } },
    { to: { row: from.row + 2, col: from.col + 1 }, leg: { row: from.row + 1, col: from.col } },
    { to: { row: from.row - 1, col: from.col - 2 }, leg: { row: from.row, col: from.col - 1 } },
    { to: { row: from.row + 1, col: from.col - 2 }, leg: { row: from.row, col: from.col - 1 } },
    { to: { row: from.row - 1, col: from.col + 2 }, leg: { row: from.row, col: from.col + 1 } },
    { to: { row: from.row + 1, col: from.col + 2 }, leg: { row: from.row, col: from.col + 1 } },
  ];

  const moves: Position[] = [];
  for (const { to, leg } of candidates) {
    if (!isInBounds(to) || !isInBounds(leg)) continue;
    if (board[leg.row][leg.col]) continue;
    const target = board[to.row][to.col];
    if (!target || !isSameColor(piece, target)) moves.push(to);
  }
  return moves;
};

// 生成象移动
const genElephantMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const player = getPiecePlayer(piece);
  if (!player) return [];

  const candidates: Array<{ to: Position; eye: Position }> = [
    { to: { row: from.row - 2, col: from.col - 2 }, eye: { row: from.row - 1, col: from.col - 1 } },
    { to: { row: from.row - 2, col: from.col + 2 }, eye: { row: from.row - 1, col: from.col + 1 } },
    { to: { row: from.row + 2, col: from.col - 2 }, eye: { row: from.row + 1, col: from.col - 1 } },
    { to: { row: from.row + 2, col: from.col + 2 }, eye: { row: from.row + 1, col: from.col + 1 } },
  ];

  const moves: Position[] = [];
  for (const { to, eye } of candidates) {
    if (!isInBounds(to) || !isInBounds(eye)) continue;
    if (board[eye.row][eye.col]) continue;

    const isAcrossRiver = player === 'red' ? to.row >= 5 : to.row <= 4;
    if (isAcrossRiver) continue;

    const target = board[to.row][to.col];
    if (!target || !isSameColor(piece, target)) moves.push(to);
  }
  return moves;
};

// 生成士移动
const genAdvisorMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const player = getPiecePlayer(piece);
  if (!player) return [];

  const candidates: Position[] = [
    { row: from.row - 1, col: from.col - 1 },
    { row: from.row - 1, col: from.col + 1 },
    { row: from.row + 1, col: from.col - 1 },
    { row: from.row + 1, col: from.col + 1 },
  ];

  const moves: Position[] = [];
  for (const to of candidates) {
    if (!isInBounds(to)) continue;
    if (!isInPalace(player, to)) continue;
    const target = board[to.row][to.col];
    if (!target || !isSameColor(piece, target)) moves.push(to);
  }
  return moves;
};

// 生成王移动
// 注意：这里【不】包含「隔空吃对方将」。将帅照面是一个【非法局面】，
// 而不是王的合法走法 —— 它的判定放在 isKingInCheck 里，见下方说明。
const genKingMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const player = getPiecePlayer(piece);
  if (!player) return [];

  const candidates: Position[] = [
    { row: from.row - 1, col: from.col },
    { row: from.row + 1, col: from.col },
    { row: from.row, col: from.col - 1 },
    { row: from.row, col: from.col + 1 },
  ];

  const moves: Position[] = [];
  for (const to of candidates) {
    if (!isInBounds(to)) continue;
    if (!isInPalace(player, to)) continue;
    const target = board[to.row][to.col];
    if (!target || !isSameColor(piece, target)) moves.push(to);
  }

  return moves;
};

// 生成卒移动
const genPawnMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const player = getPiecePlayer(piece);
  if (!player) return [];

  const forward = player === 'red' ? 1 : -1;
  const candidates: Position[] = [{ row: from.row + forward, col: from.col }];

  const crossedRiver = player === 'red' ? from.row >= 5 : from.row <= 4;
  if (crossedRiver) {
    candidates.push({ row: from.row, col: from.col - 1 });
    candidates.push({ row: from.row, col: from.col + 1 });
  }

  const moves: Position[] = [];
  for (const to of candidates) {
    if (!isInBounds(to)) continue;
    const target = board[to.row][to.col];
    if (!target || !isSameColor(piece, target)) moves.push(to);
  }
  return moves;
};

/**
 * 生成「伪合法走法」：只按各个棋子的走子规则生成，不检查走完后自己的将是否被将军。
 *
 * 单独暴露出来是为了让 isKingInCheck 能用它判断「对方能不能走到我的将的位置」，
 * 而不会又绕回 genLegalMoves 造成无限递归。
 */
export const genPseudoMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row]?.[from.col];
  if (!piece) return [];

  const upper = piece.toUpperCase();
  if (upper === 'R') return genLineMoves(board, from, [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]);
  if (upper === 'C') return genCannonMoves(board, from);
  if (upper === 'H') return genHorseMoves(board, from);
  if (upper === 'E') return genElephantMoves(board, from);
  if (upper === 'A') return genAdvisorMoves(board, from);
  if (upper === 'K') return genKingMoves(board, from);
  if (upper === 'P') return genPawnMoves(board, from);
  return [];
};

// 判断目标格子是否被 byPlayer 一方的任意棋子攻击（只看伪合法走法）
const isSquareAttacked = (board: Board, target: Position, byPlayer: Player): boolean => {
  for (let row = 0; row < rowNum; row++) {
    for (let col = 0; col < colNum; col++) {
      const piece = board[row][col];
      if (!piece || getPiecePlayer(piece) !== byPlayer) continue;
      const reached = genPseudoMoves(board, { row, col }).some(
        (m) => m.row === target.row && m.col === target.col,
      );
      if (reached) return true;
    }
  }
  return false;
};

/**
 * 判断 player 是否被将军。
 *
 * 两种情况都要算：
 *   a) 对方的某个棋子（车、炮、马、兵…）能攻击到我的将
 *   b) 将帅照面 —— 两个将同列且中间无子
 *
 * 为什么照面要放在这里，而不是当成一种「王的走法」：
 * 照面本质上是「两个将沿着空列互相攻击」，也就是说它本来就是一种被攻击的形式。
 * 把它归到「我是否被攻击」下面之后，genLegalMoves 就不需要为它写特例了 ——
 * 走一步导致照面 ⇒ isKingInCheck 为 true ⇒ 该走法被自动过滤掉。
 *
 * 反过来说：正因为删掉了 genKingMoves 里「隔空吃将」的假走法，对方王的伪合法走法
 * 再也走不到我的将头上，所以 b) 这一项必须显式写出来，否则照面会漏判。
 */
export const isKingInCheck = (board: Board, player: Player): boolean => {
  const king = findKing(board, player);
  if (!king) return false; // 防御性：棋盘上找不到将时不算被将军
  const enemy: Player = player === 'red' ? 'black' : 'red';
  // ⚠️ 不要越界，isSquareAttacked
  return isSquareAttacked(board, king, enemy) || areKingsFacing(board);
};

/**
 * 生成合法走法 = 伪合法走法 - 走完后自己被将军（含将帅照面）的走法
 */
export const genLegalMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const player = getPiecePlayer(piece);
  if (!player) return [];

  return genPseudoMoves(board, from).filter(
    (to) => !isKingInCheck(applyMove(board, from, to), player),
  );
};

// 判断 player 是否还有任何合法走法（将死 / 困毙 判定的基础）
export const hasAnyLegalMove = (board: Board, player: Player): boolean => {
  for (let row = 0; row < rowNum; row++) {
    for (let col = 0; col < colNum; col++) {
      const piece = board[row][col];
      if (!piece || getPiecePlayer(piece) !== player) continue;
      if (genLegalMoves(board, { row, col }).length > 0) return true;
    }
  }
  return false;
};

/**
 * 返回对局状态。
 *
 * 象棋与国象的关键差异：
 *   - 将死（被将军且无棋可走）→ 轮到走棋的一方输
 *   - 困毙（未被将军但无棋可走）→ 同样是轮到走棋的一方输，【不是和棋】
 * 所以两种情况的结果完全一样，可以合并成一个分支 —— 这是刻意的，不是漏写。
 * 两者在概念上的区别通过 isKingInCheck + hasAnyLegalMove 表达，测试里会分别验证。
 *
 * 本阶段不实现 60 回合无吃子、重复局面、长将等和棋规则。
 */
export const getGameStatus = (board: Board, playerToMove: Player): GameStatus => {
  if (hasAnyLegalMove(board, playerToMove)) return 'playing';
  return playerToMove === 'red' ? 'black-win' : 'red-win';
};
