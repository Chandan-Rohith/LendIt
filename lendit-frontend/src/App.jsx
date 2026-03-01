import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AddToolPage from './pages/AddToolPage';
import ToolDetailsPage from './pages/ToolDetailsPage';
import MyOrdersPage from './pages/MyOrdersPage';
import MyToolsPage from './pages/MyToolsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Hide navbar/sidebar on public pages
  const publicPaths = ['/', '/login', '/register'];
  const isPublicPage = publicPaths.includes(location.pathname);

  return (
    <div className="app">
      {isAuthenticated && !isPublicPage && (
        <>
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <Sidebar isOpen={sidebarOpen} />
        </>
      )}
      <main className={isAuthenticated && !isPublicPage ? `main-content ${sidebarOpen ? 'shifted' : ''}` : ''}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/add-tool" element={<ProtectedRoute><AddToolPage /></ProtectedRoute>} />
          <Route path="/tools/:id" element={<ProtectedRoute><ToolDetailsPage /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/my-tools" element={<ProtectedRoute><MyToolsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
