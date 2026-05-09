import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/Layout/Layout';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ================= PUBLIC ROUTES ================= */}

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Redirect root */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* ================= PROTECTED ROUTES ================= */}

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/projects"
              element={<Projects />}
            />

            <Route
              path="/projects/:id"
              element={<ProjectDetail />}
            />

            <Route
              path="/tasks"
              element={<Tasks />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />
          </Route>

          {/* ================= 404 FALLBACK ================= */}

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}