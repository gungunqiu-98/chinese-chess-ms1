/* 
  绘制棋盘和棋子
*/
import { COLORS, cell_size, colNum, offset_top, piece_labels, rowNum } from './constants';
import { isInBounds } from './engine';
import type { Board, Position } from './types';

export const getPosFromCanvasPoint = (x: number, y: number): Position | null => {
  const col = Math.round((x - offset_top) / cell_size);
  const row = Math.round((y - offset_top) / cell_size);
  const pos = { row, col };
  if (!isInBounds(pos)) return null;

  const centerX = offset_top + col * cell_size;
  const centerY = offset_top + row * cell_size;
  const dx = x - centerX;
  const dy = y - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > cell_size * 0.55) return null;
  return pos;
};

export const drawBoard = (
  canvas: HTMLCanvasElement,
  board: Board,
  selected: Position | null,
  legalMoves: Position[],
): void => {
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < rowNum; row++) {
    const y = offset_top + row * cell_size;
    ctx.beginPath();
    ctx.moveTo(offset_top, y);
    ctx.lineTo(offset_top + (colNum - 1) * cell_size, y);
    ctx.stroke();
  }

  for (let col = 0; col < colNum; col++) {
    const x = offset_top + col * cell_size;
    ctx.beginPath();
    ctx.moveTo(x, offset_top);
    ctx.lineTo(x, offset_top + (rowNum / 2 - 1) * cell_size);
    ctx.moveTo(x, offset_top + (rowNum / 2) * cell_size);
    ctx.lineTo(x, offset_top + (rowNum - 1) * cell_size);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.font = 'bold 16px FZCYJ-Medium';
  ctx.fillText('楚', offset_top + 2 * cell_size + 30, offset_top + 4.5 * cell_size + 10);
  ctx.fillText('河', offset_top + 3 * cell_size + 15, offset_top + 4.5 * cell_size + 10);
  ctx.fillText('汉', offset_top + 4 * cell_size + 30, offset_top + 4.5 * cell_size + 10);
  ctx.fillText('界', offset_top + 5 * cell_size + 15, offset_top + 4.5 * cell_size + 10);

  const drawPalace = (startCol: number, endCol: number, startY: number) => {
    ctx.beginPath();
    ctx.moveTo(startCol * cell_size + offset_top, startY);
    ctx.lineTo(endCol * cell_size + offset_top, startY + 2 * cell_size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endCol * cell_size + offset_top, startY);
    ctx.lineTo(startCol * cell_size + offset_top, startY + 2 * cell_size);
    ctx.stroke();
  };

  drawPalace(3, 5, offset_top);
  drawPalace(3, 5, offset_top + 7 * cell_size);

  const drawLine = (startCol: number, startRow: number) => {
    const x = startCol * cell_size + offset_top;
    const y = startRow * cell_size + offset_top;
    const corner: Array<[number, number]> = [
      [5, -5],
      [5, 5],
      [-5, 5],
      [-5, -5],
    ];

    corner.forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(x + dx, y + (dy > 0 ? dy + 10 : dy - 10));
      ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(x + (dx > 0 ? dx + 10 : dx - 10), y + dy);
      ctx.stroke();
    });
  };

  drawLine(1, 2);
  drawLine(7, 2);
  drawLine(1, 7);
  drawLine(7, 7);
  drawLine(0, 3);
  drawLine(2, 3);
  drawLine(4, 3);
  drawLine(6, 3);
  drawLine(8, 3);
  drawLine(0, 6);
  drawLine(2, 6);
  drawLine(4, 6);
  drawLine(6, 6);
  drawLine(8, 6);

  board.forEach((rowArray, row) => {
    rowArray.forEach((piece, col) => {
      if (!piece) return;
      const x = col * cell_size + offset_top;
      const y = row * cell_size + offset_top;
      const color = piece === piece.toUpperCase() ? COLORS.red : COLORS.black;
      ctx.beginPath();
      ctx.arc(x, y, cell_size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = 'bold 26px FZCYJ-Medium';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(piece_labels[piece], x, y);
    });
  });

  if (!selected) return;

  const { row, col } = selected;
  const x = col * cell_size + offset_top;
  const y = row * cell_size + offset_top;

  ctx.beginPath();
  ctx.arc(x, y, cell_size * 0.52, 0, Math.PI * 2);
  ctx.strokeStyle = '#12b886';
  ctx.lineWidth = 3;
  ctx.stroke();

  for (const move of legalMoves) {
    const mx = move.col * cell_size + offset_top;
    const my = move.row * cell_size + offset_top;
    const target = board[move.row][move.col];
    ctx.beginPath();
    if (target) {
      ctx.arc(mx, my, cell_size * 0.48, 0, Math.PI * 2);
      ctx.strokeStyle = '#fa5252';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(18,184,134,0.75)';
      ctx.fill();
    }
  }
};
