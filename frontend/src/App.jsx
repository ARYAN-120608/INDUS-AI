/**
 * Indus AI — Main Application Component
 * Sets up routing, WebSocket connection, and layout
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import OverviewPage from './pages/OverviewPage';
import FactoryPage from './pages/FactoryPage';
import AnalysisPage from './pages/AnalysisPage';
import TicketsPage from './pages/TicketsPage';
import AlertsPage from './pages/AlertsPage';
import { useWebSocket } from './hooks/useWebSocket';
import Loader from './components/layout/Loader';

function AppContent() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <>
      <Loader />
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/factory" element={<FactoryPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
      </Route>
    </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
