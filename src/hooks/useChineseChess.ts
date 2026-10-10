/* 
实现象棋的核心逻辑 
*/

import { useCallback, useEffect, useMemo, useState, type MouseEvent, type RefObject } from 'react';
import { drawBoard, getPosFromCanvasPoint } from '../chess/canvasBoard';
import { applyMove, cloneBoard, genLegalMoves, getGameStatus, getPiecePlayer, initBoard } from '../chess/engine';
import type { Board, GameSnapshot, Player, Position } from '../chess/types';

export const useChineseChess = (canvasRef: RefObject<HTMLCanvasElement | null>) => {
  // 棋盘、下棋、执棋方、悔棋
  const [winner, setWinner] = useState<Player | null>(null)
  const [board, setBoard] = useState<Board>(() => initBoard());
  const [selected, setSelected] = useState<Position | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('red');
  const [history, setHistory] = useState<GameSnapshot[]>([]);

  // 计算当前选中位置的合法移动
  const legalMoves = useMemo(() => {
    if (!selected) return [];
    return genLegalMoves(board, selected);
  }, [board, selected]);

  // 处理画布点击事件，实现棋子选择和移动，
  // ‼️依赖数组加上winner。否则回调会一直捕获初始winner，导致分出胜负之后还能继续走子 ———— React闭包陷阱的坑
  const handleCanvasClick = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if(winner) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const pos = getPosFromCanvasPoint(x, y);
      if (!pos) return;

      const clickedPiece = board[pos.row][pos.col];
      const clickedPlayer = getPiecePlayer(clickedPiece);

      if (!selected) {
        if (clickedPiece && clickedPlayer === currentPlayer) setSelected(pos);
        return;
      }

      if (clickedPiece && clickedPlayer === currentPlayer) {
        setSelected(pos);
        return;
      }

      // 尝试移动到目标位置(合法位置)
      const canMove = legalMoves.some((m) => m.row === pos.row && m.col === pos.col);
      if (!canMove) {
        setSelected(null);
        return;
      }

      // 快照。setState的函数式写法：新的棋盘状态和历史记录
      setHistory((prev) => [...prev, { board: cloneBoard(board), currentPlayer }]);
      const nextBoard = applyMove(board, selected, pos);
      const nextPlayer: Player = currentPlayer === 'red' ? 'black' : 'red';
      setBoard(nextBoard);
      setSelected(null);

      // 走完这一步后，看轮到走棋的一方是否已经无棋可走 —— 将死和困毙在象棋里都判负。
      // 原来的「吃掉对方的将就算赢」已经删掉了：合法走法会滤掉「走完自己被将军」的走法，
      // 所以将再也走不到能被吃的位置，那个分支不可能触发。
      const status = getGameStatus(nextBoard, nextPlayer);
      if (status !== 'playing') {
        setWinner(status === 'red-win' ? 'red' : 'black');
        return;
      }

      setCurrentPlayer(nextPlayer);
    },
    [board, canvasRef, currentPlayer, legalMoves, selected, winner],
  );

  // 悔棋函数，从历史记录中恢复上一步状态
  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      setBoard(snapshot.board);
      setCurrentPlayer(snapshot.currentPlayer);
      setSelected(null);
      // ‼️边界情况：悔棋能复活对局
      setWinner(null);
      return prev.slice(0, -1);
    });
  }, [setBoard, setCurrentPlayer, setSelected]);

  // 重置游戏函数，将棋盘重置为初始状态
   const handleReset = useCallback(() => {
    setBoard(initBoard());
    setCurrentPlayer('red');
    setSelected(null);
    setWinner(null);
    setHistory([]);
  }, []);

  // 绘制棋盘和棋子
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBoard(canvas, board, selected, legalMoves);
  }, [board, canvasRef, legalMoves, selected]);

  return {
    board,
    selected,
    currentPlayer,
    historyLength: history.length,
    canUndo: history.length > 0,
    handleCanvasClick,
    handleUndo,
    handleReset,
    winner,
  };
};
