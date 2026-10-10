/**
 * 测试用的辅助函数。
 *
 * ⚠️ 这个文件【不】叫 *.test.ts，也【不】放在 __tests__/ 目录里。
 *    CRA 的 Jest 只收集 *.test.ts / *.spec.ts（test 前面有个点），
 *    但 __tests__/ 目录下的【所有】文件都会被当成测试文件 ——
 *    把这个 helper 放进去，就会多出一个「0 个用例」的失败套件。
 */
import { colNum, rowNum } from './constants';
import type { Board, Piece, Position } from './types';


/**
 * 造一个空棋盘。
 *
 * 注意这里是【函数】而不是导出一个共享的空棋盘常量。
 * 若用共享常量，第一个用例往上摆了子，第二个用例拿到的就是脏棋盘 ——
 * 用例之间互相污染，而且出错时极难排查。每次调用都新建一份才安全。
 */
export const emptyBoard = (): Board =>
  Array.from({ length: rowNum }, () => Array.from({ length: colNum }, (): Piece => ''));

/** 摆一颗子，返回同一个棋盘，方便连着摆多颗 */
export const put = (board: Board, piece: Piece, row: number, col: number): Board => {
  board[row][col] = piece;
  return board;
};


/** 位置简写：sq(0, 4) 比 { row: 0, col: 4 } 少打一半字 */
export const sq = (row: number, col: number): Position => ({ row, col });


/**
 * 用一行字符串写一个局面。
 *   '/' 分行，第 0 行（红方底线）写在最前面，往下依次是第 1、2 … 行
 *   数字 = 连续几个空格；字母 = 棋子（大写红、小写黑，同 types.ts）
 *
 * 例：红帅在 (0,4)、黑将在 (9,4)，中间全空
 *   parseBoard('4K4/9/9/9/9/9/9/9/9/4k4')
 */
export const parseBoard = (fen: string): Board => {
  const board = emptyBoard();
  fen.trim().split('/').forEach((rowStr, row) => {
    let col = 0;
    for (const ch of rowStr) {
      if (ch >= '1' && ch <= '9') {
        col += Number(ch);
      } else {
        board[row][col] = ch as Piece;
        col += 1;
      }
    }
  });
  return board;
};


/**
 * 断言走法集合相同（忽略顺序）。
 *
 * 为什么不能直接 toEqual：走法的【顺序】是实现细节，不该让测试依赖它。
 * genPseudoMoves 里先算哪个方向是代码内部的事，改一行实现顺序就会让一堆用例假失败。
 * 所以两边先排序再比。
 */
export const expectMoves = (actual: Position[], expected: Array<[number, number]>): void => {
  const key = (m: Position) => `${m.row},${m.col}`;
  expect(actual.map(key).sort()).toEqual(expected.map(([r, c]) => key(sq(r, c))).sort());
};
