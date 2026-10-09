import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const colNum = 9;
const rowNum = 10;
const cell_size = 58;
const offset_top = 33;

type Piece = 'R' | 'H' | 'E' | 'A' | 'K' | 'C' | 'P' | 'r' | 'h' | 'e' | 'a' | 'k' | 'c' | 'p' | '';
type Player = 'red' | 'black'
type Board = Piece[][]

const piece_labels: Record<Piece, string> = {
    R: '车', H: '马', E: '象', A: '士', K: '帅', C: '炮', P: '兵',  // 红方
    r: '车', h: '马', e: '象', a: '士', k: '将', c: '炮', p: '卒',  // 黑方
    '': ''
}
const COLORS = {
    red: '#c00',
    black: '#000'
};

interface Position {
    row: number;
    col: number;
}

type GameSnapshot = {
    board: Board;
    currentPlayer: Player;
};


const initBoard = (): Board => [
    ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'C', '', '', '', '', '', 'C', ''],
    ['P', '', 'P', '', 'P', '', 'P', '', 'P'],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['p', '', 'p', '', 'p', '', 'p', '', 'p'],
    ['', 'c', '', '', '', '', '', 'c', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r']
];

const isInBounds = (pos: Position): boolean =>
    pos.row >= 0 && pos.row < rowNum && pos.col >= 0 && pos.col < colNum;

const getPiecePlayer = (piece: Piece): Player | null => {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? 'red' : 'black';
};

const isSameColor = (a: Piece, b: Piece): boolean => {
    const pa = getPiecePlayer(a);
    const pb = getPiecePlayer(b);
    return !!pa && pa === pb;
};

const cloneBoard = (board: Board): Board => board.map(row => [...row]);

const getRedPalace = (pos: Position): boolean =>
    pos.row >= 0 && pos.row <= 2 && pos.col >= 3 && pos.col <= 5;

const getBlackPalace = (pos: Position): boolean =>
    pos.row >= 7 && pos.row <= 9 && pos.col >= 3 && pos.col <= 5;

const isInPalace = (player: Player, pos: Position): boolean =>
    player === 'red' ? getRedPalace(pos) : getBlackPalace(pos);

const findKing = (board: Board, player: Player): Position | null => {
    const kingPiece: Piece = player === 'red' ? 'K' : 'k';
    for (let row = 0; row < rowNum; row++) {
        for (let col = 0; col < colNum; col++) {
            if (board[row][col] === kingPiece) return { row, col };
        }
    }
    return null;
};

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

const applyMove = (board: Board, from: Position, to: Position): Board => {
    const next = cloneBoard(board);
    next[to.row][to.col] = next[from.row][from.col];
    next[from.row][from.col] = '';
    return next;
};

const genLineMoves = (board: Board, from: Position, deltas: Array<[number, number]>): Position[] => {
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

const genCannonMoves = (board: Board, from: Position): Position[] => {
    const piece = board[from.row][from.col];
    if (!piece) return [];

    const moves: Position[] = [];
    const deltas: Array<[number, number]> = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
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
        { to: { row: from.row + 1, col: from.col + 2 }, leg: { row: from.row, col: from.col + 1 } }
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

const genElephantMoves = (board: Board, from: Position): Position[] => {
    const piece = board[from.row][from.col];
    if (!piece) return [];
    const player = getPiecePlayer(piece);
    if (!player) return [];

    const candidates: Array<{ to: Position; eye: Position }> = [
        { to: { row: from.row - 2, col: from.col - 2 }, eye: { row: from.row - 1, col: from.col - 1 } },
        { to: { row: from.row - 2, col: from.col + 2 }, eye: { row: from.row - 1, col: from.col + 1 } },
        { to: { row: from.row + 2, col: from.col - 2 }, eye: { row: from.row + 1, col: from.col - 1 } },
        { to: { row: from.row + 2, col: from.col + 2 }, eye: { row: from.row + 1, col: from.col + 1 } }
    ];

    const moves: Position[] = [];
    for (const { to, eye } of candidates) {
        if (!isInBounds(to) || !isInBounds(eye)) continue;
        if (board[eye.row][eye.col]) continue;

        const isAcrossRiver =
            player === 'red' ? to.row >= 5 : to.row <= 4;
        if (isAcrossRiver) continue;

        const target = board[to.row][to.col];
        if (!target || !isSameColor(piece, target)) moves.push(to);
    }
    return moves;
};

const genAdvisorMoves = (board: Board, from: Position): Position[] => {
    const piece = board[from.row][from.col];
    if (!piece) return [];
    const player = getPiecePlayer(piece);
    if (!player) return [];

    const candidates: Position[] = [
        { row: from.row - 1, col: from.col - 1 },
        { row: from.row - 1, col: from.col + 1 },
        { row: from.row + 1, col: from.col - 1 },
        { row: from.row + 1, col: from.col + 1 }
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

const genKingMoves = (board: Board, from: Position): Position[] => {
    const piece = board[from.row][from.col];
    if (!piece) return [];
    const player = getPiecePlayer(piece);
    if (!player) return [];

    const candidates: Position[] = [
        { row: from.row - 1, col: from.col },
        { row: from.row + 1, col: from.col },
        { row: from.row, col: from.col - 1 },
        { row: from.row, col: from.col + 1 }
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

const genMovesForPiece = (board: Board, from: Position): Position[] => {
    const piece = board[from.row]?.[from.col];
    if (!piece) return [];

    const upper = piece.toUpperCase();
    if (upper === 'R') return genLineMoves(board, from, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
    if (upper === 'C') return genCannonMoves(board, from);
    if (upper === 'H') return genHorseMoves(board, from);
    if (upper === 'E') return genElephantMoves(board, from);
    if (upper === 'A') return genAdvisorMoves(board, from);
    if (upper === 'K') return genKingMoves(board, from);
    if (upper === 'P') return genPawnMoves(board, from);
    return [];
};

const genLegalMoves = (board: Board, from: Position): Position[] => {
    const piece = board[from.row][from.col];
    if (!piece) return [];
    const player = getPiecePlayer(piece);
    if (!player) return [];

    const candidates = genMovesForPiece(board, from);
    return candidates.filter(to => {
        const next = applyMove(board, from, to);
        return !areKingsFacing(next);
    });
};

function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [board, setBoard] = useState<Board>(() => initBoard());
    const [selected, setSelected] = useState<Position | null>(null)
    const [currentPlayer, setCurrentPlayer] = useState<Player>('red')
    const [history, setHistory] = useState<GameSnapshot[]>([])
    const [winner, setWinner] = useState<Player | null>(null)

    const legalMoves = useMemo(() => {
        if (!selected) return [];
        return genLegalMoves(board, selected);
    }, [board, selected]);

    const getPosFromCanvasPoint = (x: number, y: number): Position | null => {
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

    const drawBoard = useCallback(() => {
      const canvas = canvasRef.current;
      if(!canvas) return
      const ctx = canvas.getContext('2d')!;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for(let row=0; row<rowNum; row++){
          const y = offset_top + row*cell_size;
          ctx.beginPath();
          ctx.moveTo(offset_top, y);
          ctx.lineTo(offset_top + (colNum-1) * cell_size, y);
          ctx.stroke();
      }
      for(let col=0; col<colNum; col++){
          const x = offset_top + col * cell_size;
          ctx.beginPath();
          ctx.moveTo(x,offset_top);
          ctx.lineTo(x, offset_top + (rowNum/2 - 1) * cell_size);
          ctx.moveTo(x,offset_top + (rowNum/2) * cell_size);
          ctx.lineTo(x, offset_top + (rowNum-1) * cell_size);
          ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.font = 'bold 16px FZCYJ-Medium';
      ctx.fillText('楚', offset_top + 2 * cell_size + 30, offset_top + 4.5 * cell_size + 10);
      ctx.fillText('河', offset_top + 3 * cell_size + 15, offset_top + 4.5 * cell_size + 10);
      ctx.fillText('汉', offset_top + 4 * cell_size + 30, offset_top + 4.5 * cell_size + 10);
      ctx.fillText('界', offset_top + 5 * cell_size + 15, offset_top + 4.5 * cell_size + 10);

      const drawPalace = (startCol:number, endCol:number, startY:number) => {
          ctx.beginPath();
          ctx.moveTo(startCol*cell_size+offset_top, startY);
          ctx.lineTo(endCol*cell_size+offset_top, startY+2*cell_size);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(endCol*cell_size+offset_top, startY);
          ctx.lineTo(startCol*cell_size+offset_top, startY+2*cell_size);
          ctx.stroke();
      }
      drawPalace(3,5,offset_top)
      drawPalace(3,5,offset_top+7*cell_size)

      const drawLine = (startCol:number, startRow:number) => {
          const x = startCol * cell_size + offset_top;
          const y = startRow * cell_size + offset_top;
          const corner = [
              [5,-5], [5,5], [-5,5], [-5,-5]
          ]

          corner.forEach(([dx,dy],index) => {
              ctx.beginPath();
              ctx.moveTo(x+dx, y+dy);
              ctx.lineTo(x+dx,y + ( dy>0 ? dy+10:dy-10) );
              ctx.moveTo(x+dx, y+dy);
              ctx.lineTo(x + ( dx>0 ? dx+10:dx-10 ),y+dy);
              ctx.stroke();
          })
      }
      drawLine(1,2);drawLine(7,2)
      drawLine(1,7);drawLine(7,7)
      drawLine(0,3);drawLine(2,3);drawLine(4,3);drawLine(6,3);drawLine(8,3);
      drawLine(0,6);drawLine(2,6);drawLine(4,6);drawLine(6,6);drawLine(8,6);

      board.forEach((rowArray,row) => {
          rowArray.forEach((piece,col) => {
              if(piece){
                  const x = col * cell_size + offset_top
                  const y = row * cell_size + offset_top
                  const color = piece === piece.toUpperCase() ? COLORS.red : COLORS.black;
                  ctx.beginPath();
                  ctx.arc(x,y, cell_size / 2,0,Math.PI * 2);
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
              }
          })
      })

      if (selected) {
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
      }
    }, [board, legalMoves, selected]);

    const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (winner) return;
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

        const canMove = legalMoves.some(m => m.row === pos.row && m.col === pos.col);
        if (!canMove) {
            setSelected(null);
            return;
        }

        setHistory(prev => [...prev, { board: cloneBoard(board), currentPlayer }]);
        const captured = board[pos.row][pos.col];
        const nextBoard = applyMove(board, selected, pos);
        setBoard(nextBoard);
        setSelected(null);
        if (captured === 'k' || captured === 'K') {
            setWinner(currentPlayer);
            return;
        }
        setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red');
    }

    useEffect(() => {
        drawBoard();
    }, [drawBoard]);

    const handleUndo = () => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const snapshot = prev[prev.length - 1];
            setBoard(snapshot.board);
            setCurrentPlayer(snapshot.currentPlayer);
            setSelected(null);
            setWinner(null);
            return prev.slice(0, -1);
        });
    };

    const handleReset = () => {
        setBoard(initBoard());
        setCurrentPlayer('red');
        setSelected(null);
        setHistory([]);
        setWinner(null);
    };

    return (
      <div style={{textAlign: 'center', padding: '20px', fontFamily: 'FZCYJ-Medium'}}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: 16 }}>
                  {winner ? (
                      <>
                          对局结束：<span style={{ color: winner === 'red' ? COLORS.red : COLORS.black, fontWeight: 700 }}>
                              {winner === 'red' ? '红方胜' : '黑方胜'}
                          </span>
                      </>
                  ) : (
                      <>
                          当前执棋：<span style={{ color: currentPlayer === 'red' ? COLORS.red : COLORS.black, fontWeight: 700 }}>
                              {currentPlayer === 'red' ? '红方' : '黑方'}
                          </span>
                      </>
                  )}
              </div>
              <button onClick={handleUndo} disabled={history.length === 0} style={{ padding: '6px 10px' }}>
                  悔棋
              </button>
              <button onClick={handleReset} style={{ padding: '6px 10px' }}>
                  重新开始
              </button>
          </div>
           <canvas
              ref={canvasRef}
              width={(colNum-1) * cell_size + offset_top*2}
              height={(rowNum-1) * cell_size + offset_top*2}
              onClick={handleClick}
              style={{border: '2px solid #333', backgroundColor: '#f8e8b8', cursor: 'pointer'}}
          />
      </div>
    );

}

export default App;
