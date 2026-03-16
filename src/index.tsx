import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './assets/font/font.css'
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
)

root.render(
    // React 的 StrictMode 会使得组件在开发环境下渲染了两次：帮助开发者提前发现副作用问题，比如定时器清理
    <React.StrictMode>
    <App />
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
