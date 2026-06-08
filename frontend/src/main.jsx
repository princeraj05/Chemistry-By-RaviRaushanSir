import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import App from './App.jsx';
import './index.css';
import axios from 'axios';

// Set global API base URL. During development, VITE_API_URL is loaded from local .env.
// In production (Vercel), it falls back to the hosted backend on Render.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://chemistry-by-raviraushansir.onrender.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
