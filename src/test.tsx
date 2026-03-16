import React, { useRef, useEffect, useState } from 'react';

// 棋盘尺寸
const ROWS = 10;
const COLS = 9;
const CELL_SIZE = 48;
const OFFSET_TOP = 40;

// 棋子类型
type Piece = 'R' | 'H' | 'E' | 'A' | 'K' | 'C' | 'P' | 'r' | 'h' | 'e' | 'a' | 'k' | 'c' | 'p' | '';

// 棋盘状态类型
type Board = Piece[][];

// 位置类型
interface Position {
    row: number;
    col: number;
}

// 游戏状态
type Player = 'red' | 'black';

// 棋子映射
const PIECE_LABELS: Record<Piece, string> = {
    R: '车', H: '马', E: '象', A: '士', K: '帅', C: '炮', P: '兵',
    r: '车', h: '马', e: '象', a: '士', k: '将', c: '炮', p: '卒',
    '': ''
};

const COLORS = {
    red: '#c00',
    black: '#000'
};

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [board, setBoard] = useState<Board>([]);
    const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<Player>('red');

    // 初始化棋盘数据
    const initBoard = (): Board => [
        ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'],
        ['',  '',  '',  '',  '',  '',  '',  '',  ''],
        ['', 'C',  '',  '',  '',  '',  '', 'C',  ''],
        ['P', '', 'P', '', 'P', '', 'P', '', 'P'],
        ['',  '',  '',  '',  '',  '',  '',  '',  ''],
        ['',  '',  '',  '',  '',  '',  '',  '',  ''],
        ['p', '', 'p', '', 'p', '', 'p', '', 'p'],
        ['', 'c',  '',  '',  '',  '',  '', 'c',  ''],
        ['',  '',  '',  '',  '',  '',  '',  '',  ''],
        ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r']
    ];

    // 重置游戏
    const resetGame = () => {
        setBoard(initBoard());
        setSelectedPiece(null);
        setCurrentPlayer('red');
    };

    // 坐标转行列
    const getRowCol = (x: number, y: number): Position | null => {
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor((y - OFFSET_TOP) / CELL_SIZE);
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            return { row, col };
        }
        return null;
    };

    // 是否当前玩家的棋子
    const isCurrentPlayerPiece = (piece: Piece): boolean => {
        const isRed = piece === piece.toUpperCase() && piece !== '';
        return (currentPlayer === 'red' && isRed) || (currentPlayer === 'black' && !isRed);
    };

    // 是否同色
    const isSameColor = (a: Piece, b: Piece): boolean => {
        if (!a || !b) return false;
        const aRed = a === a.toUpperCase();
        const bRed = b === b.toUpperCase();
        return (aRed && bRed) || (!aRed && !bRed);
    };

    // 绘制棋盘
    const drawBoard = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制线条
        for (let row = 0; row < ROWS; row++) {
            const y = OFFSET_TOP + row * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        for (let col = 0; col < COLS; col++) {
            const x = col * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(x, OFFSET_TOP);
            ctx.lineTo(x, OFFSET_TOP + 9 * CELL_SIZE);
            ctx.stroke();
        }

        // 楚河汉界
        ctx.font = 'bold 16px SimHei';
        ctx.textAlign = 'center';
        ctx.fillText('楚', 180, OFFSET_TOP + 4.5 * CELL_SIZE + 10);
        ctx.fillText('河', 210, OFFSET_TOP + 4.5 * CELL_SIZE + 10);
        ctx.fillText('汉', 270, OFFSET_TOP + 4.5 * CELL_SIZE + 10);
        ctx.fillText('界', 300, OFFSET_TOP + 4.5 * CELL_SIZE + 10);

        // 九宫格斜线
        const drawPalace = (startCol: number, endCol: number, startY: number) => {
            ctx.beginPath();
            ctx.moveTo(startCol * CELL_SIZE, startY);
            ctx.lineTo(endCol * CELL_SIZE, startY + 2 * CELL_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(endCol * CELL_SIZE, startY);
            ctx.lineTo(startCol * CELL_SIZE, startY + 2 * CELL_SIZE);
            ctx.stroke();
        };
        drawPalace(3, 5, OFFSET_TOP + 0);
        drawPalace(3, 5, OFFSET_TOP + 7 * CELL_SIZE);

        // 绘制棋子
        board.forEach((rowArr, row) => {
            rowArr.forEach((piece, col) => {
                if (piece) {
                    const x = col * CELL_SIZE + CELL_SIZE / 2;
                    const y = OFFSET_TOP + row * CELL_SIZE + CELL_SIZE / 2;
                    const color = piece === piece.toUpperCase() ? COLORS.red : COLORS.black;
                    ctx.beginPath();
                    ctx.arc(x, y, CELL_SIZE / 2 - 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.font = 'bold 20px SimHei';
                    ctx.fillStyle = color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(PIECE_LABELS[piece], x, y);
                }
            });
        });

        // 高亮选中
        if (selectedPiece) {
            const { row, col } = selectedPiece;
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 3;
            ctx.strokeRect(col * CELL_SIZE, OFFSET_TOP + row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    };

    // 处理点击
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const pos = getRowCol(x, y);
        if (!pos) return;

        const { row, col } = pos;
        const piece = board[row][col];

        if (selectedPiece) {
            const { row: fromRow, col: fromCol } = selectedPiece;

            // 不能吃自己人
            if (piece && isSameColor(piece, board[fromRow][fromCol])) {
                setSelectedPiece({ row, col });
                return;
            }

            // 移动（暂无规则校验）
            const newBoard = board.map(r => [...r]);
            newBoard[row][col] = newBoard[fromRow][fromCol];
            newBoard[fromRow][fromCol] = '';

            setBoard(newBoard);
            setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red');
            setSelectedPiece(null);
        } else {
            if (piece && isCurrentPlayerPiece(piece)) {
                setSelectedPiece({ row, col });
            }
        }
    };

    // 初始化
    useEffect(() => {
        setBoard(initBoard());
    }, []);

    // 每次 board 或 selectedPiece 变化时重绘
    useEffect(() => {
        drawBoard();
    }, [board, selectedPiece]);

    return (
        <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'Arial' }}>
    <h1>中国象棋 - React + TypeScript</h1>
    <canvas
    ref={canvasRef}
    width={COLS * CELL_SIZE}
    height={ROWS * CELL_SIZE + OFFSET_TOP}
    onClick={handleClick}
    style={{ border: '2px solid #333', backgroundColor: '#f8e8b8', cursor: 'pointer' }}
    />
    <div style={{ marginTop: '10px', fontSize: '18px' }}>
    当前回合：<strong>{currentPlayer === 'red' ? '红方' : '黑方'}</strong>
    </div>
    <button
    onClick={resetGame}
    style={{ marginTop: '10px', padding: '8px 16px', fontSize: '16px', cursor: 'pointer' }}
>
    重新开始
    </button>
    </div>
);
};

export default App;
