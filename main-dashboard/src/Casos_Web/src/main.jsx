import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import CasesPage from './pages/CasesPage.jsx';
import CaseDetailPage from './pages/CaseDetailPage.jsx';
import './App.css'; 


const router = createBrowserRouter([
  {
    path: "/", 
    element: <CasesPage />, 
  },
  {
    path: "/case/:caseId", 
    element: <CaseDetailPage />, 
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    
    <RouterProvider router={router} />
  </React.StrictMode>
);