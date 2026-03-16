import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

test('renders without crashing', () => {
  const container = document.createElement('div');
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(<App />);
  });
});
