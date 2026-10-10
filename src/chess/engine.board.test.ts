/**
 * 棋盘基础操作的测试 —— 作为其余测试文件的模板。
 *
 * 这组是「机械」用例：只验证数据结构的形状和纯函数性，不含棋规知识。
 * 真正有难度的是 engine.pieces / engine.rules / engine.status，那些留给你写。
 * 
 * Jest框架提供的全局API
 *   describe  一节标题
 *   it  一条用例
 *   expect(实际结果).toEqual(期望结果)  断言
 * 
 * 匹配器
 *   toEqual()        数组
 *   toContainEqual() 对象
 *   toBe()         数字/布尔/字符串
 *   toHaveLength() 长度
 */
import { applyMove, cloneBoard, initBoard } from './engine';
import { emptyBoard, put, sq } from './testUtils';

describe('initBoard', () => {
  it('是 10 行 9 列', () => {
    const board = initBoard();
    expect(board).toHaveLength(10);
    board.forEach((row) => expect(row).toHaveLength(9));
  });

  it('双方各 16 颗子', () => {
    const flat = initBoard().flat();
    const red = flat.filter((p) => p !== '' && p === p.toUpperCase());
    const black = flat.filter((p) => p !== '' && p === p.toLowerCase());
    expect(red).toHaveLength(16);
    expect(black).toHaveLength(16);
  });

  it('红方底线在第 0 行（这是本项目的棋盘方向，别和传统 FEN 搞反）', () => {
    const board = initBoard();
    expect(board[0][4]).toBe('K'); // 红帅
    expect(board[9][4]).toBe('k'); // 黑将
    expect(board[3][0]).toBe('P'); // 红兵
    expect(board[6][0]).toBe('p'); // 黑卒
  });
});


/**
 * 问题："为什么值得测"？
 * applyMove 不动原棋盘：为写 AI搜索 做准备
 * 这一步涉及：AI 搜索的正确性（ 走一步→评估→撤销 ）
 * 
 * 函数其他易错点有哪些，即用例有价值：
 * 2. 这规则在象棋里容易搞错 —— 炮翻山、马腿、将帅照面
 * 3. 边界 —— 棋盘边、河界、九宫边
 */
describe('applyMove', () => {
  it('把子从 from 挪到 to，from 变空', () => {
    const board = emptyBoard();
    put(board, 'R', 0, 0);

    const next = applyMove(board, sq(0, 0), sq(0, 5));

    expect(next[0][0]).toBe('');
    expect(next[0][5]).toBe('R');
  });

  it('可以吃子：目标格上的对方子被覆盖', () => {
    const board = emptyBoard();
    put(board, 'R', 0, 0);
    put(board, 'p', 0, 5);

    const next = applyMove(board, sq(0, 0), sq(0, 5));

    expect(next[0][5]).toBe('R');
    expect(next.flat().filter((p) => p !== '')).toHaveLength(1);
  });

  it('是纯函数：调用后原棋盘丝毫未变', () => {
    const board = emptyBoard();
    put(board, 'R', 0, 0);

    applyMove(board, sq(0, 0), sq(0, 5));

    // 这条很重要：后面 AI 搜索要靠「走一步 → 评估 → 撤销」，
    // 如果 applyMove 偷偷改了原棋盘，搜索出来的结果全是错的。
    expect(board[0][0]).toBe('R');
    expect(board[0][5]).toBe('');
  });
});

describe('cloneBoard', () => {
  it('是深拷贝：改副本不影响原棋盘', () => {
    const board = initBoard();
    const copy = cloneBoard(board);

    copy[0][0] = '';
    copy[0][1] = '';

    expect(board[0][0]).toBe('R');
    expect(board[0][1]).toBe('H');
  });
});
