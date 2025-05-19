import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './styles/index.css';

import '@/store/authStore';

import { initializeAppData } from './lib/initialize-data';

initializeAppData().catch(error => 
  console.error('Falha ao inicializar dados da aplicação:', error)
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
