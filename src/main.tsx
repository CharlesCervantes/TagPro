import { Toaster } from 'react-hot-toast';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* <BrowserRouter> */}
      <Toaster />
      <App />
    {/* </BrowserRouter> */}
  </React.StrictMode>,
)
