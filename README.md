# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).


## note
.css  样式文件
.test.tsx文件  .test.ts文件，用于编写单元测试或组件测试（Jest）
.ts   纯TypeScript逻辑文件              
.tsx  TypeScript类型检查 + JSX模版语法   === 类似.vue单文件组件
TypeScript类型检查    === 类似vue3 + <script setup> + TypeScript
JSX模版语法           === 类似vue的模版语法（Template）

index.tsx  入口文件
index.css  全局样式
App.tsx    根组件

```tsx
import React, {useEffect, useRef, useState} from 'react';
import './App.css';

// 棋盘尺寸
const colNum = 9;
const rowNum = 10;
const cell_size = 58;
const offset_top = 10;

// 函数声明函数式组件 -- TypeScript 自动推导返回类型为 JSX.Element
function App() {
    // 创建一个引用页面上<canvas>元素的 ref, 
    // React中的useRef 类似 vue的ref 可存储DOM元素、计时器ID、上一次的值、自定义对象等
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // 定义一个状态变量和函数。
    // const [board, setBoard]：JavaScript 解构赋值的语法  ;
    // useState<Board>：Board自定义类型
    const [board, setBoard] = useState<Board>([]);

    // 初始化棋盘。 
    // ():Board => TypeScript 类型注解：无参数，返回值类型是 Board
    const initBoard = ():Board => [
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
    ]

    // 绘制棋盘
    const drawBoard = () => {
        // 读取 元素的ref的值
        const canvas = canvasRef.current;  
        
        if(!canvas) {
            console.log("canvas DOM元素未渲染成功")
            return
        }
        // 获取2d渲染上下文。 ! 指的是 告诉TS,确信不会返回空
        const ctx = canvas.getContext('2d')!;

        // 从x,y坐标开始清空固定大小的画布。
        // Canvas是基于像素(由无数个小点组成)的绘图表面，绘画的图形不会自动清除，所以要自己处理
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 10*9(row*col)
        for(let row=0; row<rowNum; row++){
            const y = offset_top + row*cell_size;
            // 开始绘制标识，防止与上一次绘制混淆
            ctx.beginPath();
            // 画笔移动到某个位置，不会绘制图像，绘制起点
            ctx.moveTo(offset_top, y);
            // 绘制终点
            ctx.lineTo(offset_top + (colNum-1) * cell_size, y);
            // 执行绘制的操作
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

        // 斜线
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

        // 棋盘十字标识
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
        drawLine(1,2)
        drawLine(7,2)
        drawLine(1,7)
        drawLine(7,7)

        drawLine(0,3)
        drawLine(2,3)
        drawLine(4,3)
        drawLine(6,3)
        drawLine(8,3)
        drawLine(0,6)
        drawLine(2,6)
        drawLine(4,6)
        drawLine(6,6)
        drawLine(8,6)
    }

    // 处理点击。 event是自定义形参接收事件对象；
    // React.MouseEvent<HTMLCanvasElement> --- TypeScript 类型注解：泛型类型<泛型参数>
    const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {}

    // 初始化
    // useEffect(() => {
    //     setBoard(initBoard());
    // }, []);

    // useEffect 内的程序会在组件渲染页面之后，即DOM挂载完成之后进行执行，即ref已经绑定到真实的DOM节点上
    useEffect(() => {
        drawBoard();
    }, [board]); // 每次 board 或 selectedPiece 变化时重绘

    // 使用canvas画棋盘
    return (
        <div style={{textAlign: 'center', padding: '20px', fontFamily: 'FZCYJ-Medium'}}>
            {/*<h1>中国象棋 - React + TypeScript</h1>*/}
            <canvas
                ref={canvasRef}
                width={(colNum-1) * cell_size + offset_top*2}
                height={(rowNum-1) * cell_size + offset_top*2}
                onClick={handleClick}
                style={{border: '2px solid #333', backgroundColor: '#f8e8b8', cursor: 'pointer'}}
            />
            {/*<div style={{marginTop: '10px', fontSize: '18px'}}>*/}
            {/*    当前回合：<strong>{currentPlayer === 'red' ? '红方' : '黑方'}</strong>*/}
            {/*</div>*/}
            {/*<button onClick={resetGame} style={{marginTop: '10px', padding: '8px 16px', fontSize: '16px', cursor: 'pointer'}}>*/}
            {/*    重新开始*/}
            {/*</button>*/}
        </div>
    );

}

export default App;

```

