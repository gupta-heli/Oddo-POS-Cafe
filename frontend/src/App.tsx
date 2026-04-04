import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuthStore } from './stores/authStore';

// Lazy load pages
const FloorPlan = React.lazy(() => import('./pages/FloorPlan'));
const POSTerminal = React.lazy(() => import('./pages/POSTerminal'));
const KitchenDisplay = React.lazy(() => import('./pages/KitchenDisplay'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Terminals = React.lazy(() => import('./pages/Terminals'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const SelfOrder = React.lazy(() => import('./pages/SelfOrder'));
const CustomerDisplay = React.lazy(() => import('./pages/CustomerDisplay'));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <React.Suspense fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-background text-primary">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-outline font-black text-[10px] uppercase tracking-[0.3em]">Igniting System...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/self-order/:token" element={<SelfOrder />} />
          <Route path="/display/:tableId" element={<CustomerDisplay />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }>
            <Route index element={<Analytics />} />
            <Route path="floor" element={<FloorPlan />} />
            <Route path="pos" element={<POSTerminal />} />
            <Route path="kitchen" element={<KitchenDisplay />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="inventory" element={<div className="p-10 text-outline font-black text-center uppercase tracking-widest py-20 opacity-20">Inventory Module Coming Soon</div>} />
            <Route path="settings" element={<Terminals />} />
          </Route>
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;
