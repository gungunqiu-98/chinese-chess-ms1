/* 
  象棋走子规则的核心 
*/
import { colNum, rowNum } from './constants';
import type { Board, Piece, Player, Position } from './types';

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

// 检查位置是否在红方 palace 内
const getRedPalace = (pos: Position): boolean =>
  pos.row >= 0 && pos.row <= 2 && pos.col >= 3 && pos.col <= 5;

// 检查位置是否在黑方 palace 内
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

// 检查红方王和黑方王是否面对面
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

  const opponentKing = findKing(board, player === 'red' ? 'black' : 'red');
  if (opponentKing && opponentKing.col === from.col) {
    const col = from.col;
    const start = Math.min(opponentKing.row, from.row) + 1;
    const end = Math.max(opponentKing.row, from.row) - 1;
    let blocked = false;
    for (let row = start; row <= end; row++) {
      if (board[row][col]) {
        blocked = true;
        break;
      }
    }
    if (!blocked) {
      moves.push({ row: opponentKing.row, col: opponentKing.col });
    }
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

// 生成所有棋子的移动
const genMovesForPiece = (board: Board, from: Position): Position[] => {
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

// 生成合法移动
export const genLegalMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const player = getPiecePlayer(piece);
  if (!player) return [];

  const candidates = genMovesForPiece(board, from);
  return candidates.filter((to) => {
    const next = applyMove(board, from, to);
    return !areKingsFacing(next);
  });
};
