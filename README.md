# 介绍：CRA方式 对比 其他替代方式

文件是 CRA 生成的；内容 = CRA 样板 + 你自己追加的一段。
- CRA 生成的文件（create-react-app 搭脚手架时创建的）
- CRA 写的模板内容（它往文件里塞的样板代码）

CRA = Create React App,是 Meta(Facebook)官方出的 React 项目脚手架工具
CRA 在 2025 年 2 月被 Meta 正式宣布弃用,仓库已归档,不再维护。react-scripts 5.0.1 就是最后一个主要版本
常见替代：
- Vite
- Next.js(需要SSR/路由/全栈时用)
- React Router 偏框架式方案


React版本： React 19.1.1，2024 年底发布的
||是什么|你的值|
|---|---|---|
|**React 版本**|React 库本身（`useState`、`useRef` 这些从哪来）|19.1.1|
|**CRA 版本**（react-scripts）|打包/构建工具链|5.0.1|
|**TypeScript 版本**|类型检查器|4.9.5 2022 年的|

对比 React 18
- 不需要 import React from 'react'
  新的 JSX 转换（"jsx": "react-jsx"）下，JSX 会自动引入所需的东西
- useRef 的签名变了
  React 18：useRef<HTMLCanvasElement>(null) 返回 RefObject<HTMLCanvasElement>
  React 19：返回 RefObject<HTMLCanvasElement | null>
- ref 可以直接当普通 prop 传
- 新的 Hooks
  useActionState、useOptimistic、useFormStatus——都是围绕表单和异步提交的。你这个纯本地游戏用不上。
- 服务端组件（RSC）
  React 19 的大特性之一，但需要 Next.js 这类框架支持。CRA 用不上，所以对你完全是透明的——看到相关文章时不用管。

# Note：重构之前的
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

