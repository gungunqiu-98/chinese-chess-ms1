import { useRef } from 'react';
import { colNum, rowNum, cell_size, offset_top, COLORS } from './chess/constants'
import { useChineseChess } from './hooks/useChineseChess'

function App() {

    // ① ref属性，让 React 把 DOM 挂上去 ② onClick事件，hook 返回的处理函数
    const canvasRef = useRef<HTMLCanvasElement>(null) // 定义canvas画布

    const {
        currentPlayer,
        winner,
        historyLength,
        handleCanvasClick: handleClick,
        handleUndo,
        handleReset,
    } = useChineseChess(canvasRef)


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
              <button onClick={handleUndo} disabled={historyLength === 0} style={{ padding: '6px 10px' }}>
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
