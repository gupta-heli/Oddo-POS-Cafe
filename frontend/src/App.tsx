import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuthStore } from './stores/authStore';

// DIRECT IMPORTS
import Splash from './pages/Splash';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import FloorPlan from './pages/FloorPlan';
import POSTerminal from './pages/POSTerminal';
import KitchenDisplay from './pages/KitchenDisplay';
import Analytics from './pages/Analytics';
import Payments from './pages/Payments';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Terminals from './pages/Terminals';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SelfOrder from './pages/SelfOrder';
import CustomerDisplay from './pages/CustomerDisplay';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/self-order/:token" element={<SelfOrder />} />
        <Route path="/display/:tableId" element={<CustomerDisplay />} />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="floor" element={<FloorPlan />} />
          <Route path="pos" element={<POSTerminal />} />
          <Route path="kitchen" element={<KitchenDisplay />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="payments" element={<Payments />} />
          <Route path="customers" element={<Customers />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="terminals" element={<Terminals />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
