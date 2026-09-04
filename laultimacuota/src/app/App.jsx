import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../shared/context/AuthContext';
import { ToastProvider } from '../shared/context/ToastContext';
import { SocketProvider } from '../shared/context/SocketContext';
import DashboardLayout from '../shared/components/DashboardLayout';
import PrivateRoute from '../shared/components/PrivateRoute';
import Landing from '../features/landing/pages/Landing';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import Home from '../features/races/pages/Home';
import Calendar from '../features/races/pages/Calendar';
import RaceDetail from '../features/races/pages/RaceDetail';
import RaceSimulation from '../features/races/pages/RaceSimulation';
import Gacha from '../features/gacha/pages/Gacha';
import Stable from '../features/stable/pages/Stable';
import Market from '../features/market/pages/Market';
import History from '../features/history/pages/History';
import Simulador from '../features/races/pages/Simulador';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <SocketProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Landing />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Home />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/calendario"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Calendar />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/carrera/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <RaceDetail />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/carrera/:id/simulacion"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <RaceSimulation />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/gacha"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Gacha />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/establo"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Stable />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mercado"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Market />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/historial"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <History />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/simulador"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Simulador />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </SocketProvider>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
