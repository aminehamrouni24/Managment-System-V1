import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Suppliers } from "./pages/Suppliers";
import { Customers } from "./pages/Customers";
import { Invoices } from "./pages/Invoices";
import { Stock } from "./pages/Stock";
import { Reports } from "./pages/Reports";
import { Exports } from "./pages/Exports";
import { Settings } from "./pages/Settings";
import { Navbar } from "./components/Layout/Navbar";
import { Sidebar } from "./components/Layout/Sidebar";
import {Shipment} from "./pages/Shipment";
import { Client } from "./pages/Client";
import { DeliveryNotes } from "./pages/DeliveryNotes";
import { Partners } from "./pages/Partners";
import Bordereau from "./pages/Bordereau";
 

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedLayout>
            <Products />
          </ProtectedLayout>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedLayout>
            <Suppliers />
          </ProtectedLayout>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedLayout>
            <Customers />
          </ProtectedLayout>
        }
      />
      <Route
        path="/bondelivraison"
        element={
          <ProtectedLayout>
            <DeliveryNotes />
          </ProtectedLayout>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedLayout>
            <Invoices />
          </ProtectedLayout>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedLayout>
            <Stock />
          </ProtectedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedLayout>
            <Reports />
          </ProtectedLayout>
        }
      />
      <Route
        path="/exports"
        element={
          <ProtectedLayout>
            <Exports />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        }
      />
      <Route
        path="/client"
        element={
          <ProtectedLayout>
            <Client />
          </ProtectedLayout>
        }
      />
      <Route
        path="/partners"
        element={
          <ProtectedLayout>
            <Partners />
          </ProtectedLayout>
        }
      />
      <Route
        path="/shipment"
        element={
          <ProtectedLayout>
            <Shipment />
          </ProtectedLayout>
        }
      />
      <Route
        path="/bordereau"
        element={
          <ProtectedLayout>
            < Bordereau />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
