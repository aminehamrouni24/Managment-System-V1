import {
  LayoutDashboard,
  Package,
  Users,
  UserCircle,
  FileText,
  TrendingUp,
  BarChart3,
  Download,
  Settings,
  X,
  Container
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useLocation, useNavigate } from "react-router";
import { useState } from "react";

export function Sidebar() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: t.nav.dashboard },
    { path: "/products", icon: Package, label: t.nav.products },
    { path: "/suppliers", icon: Users, label: t.nav.suppliers },
    { path: "/customers", icon: UserCircle, label: t.nav.customers },
    { path: "/shipment", icon: Container, label: t.nav.shipment },
    { path: "/invoices", icon: FileText, label: t.nav.invoices },
    { path: "/stock", icon: TrendingUp, label: t.nav.stock },
    { path: "/reports", icon: BarChart3, label: t.nav.reports },
    { path: "/exports", icon: Download, label: t.nav.exports },
    { path: "/settings", icon: Settings, label: t.nav.settings },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={
          "fixed lg:sticky top-0 h-screen bg-white border-r w-64 transform transition-transform z-50 " +
          (isOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0")
        }
      >
        <div className="flex flex-col h-full">
          {/* Header (mobile only) */}
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <h2 className="text-lg font-semibold">{t.nav.home}</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t text-center text-xs text-gray-500">
            <p>© 2025 KETHIRI</p>
          </div>
        </div>
      </aside>

      {/* Mobile toggle button (optional, can be added in Navbar) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 lg:hidden bg-green-600 text-white p-3 rounded-full shadow-lg"
      >
        ☰
      </button>
    </>
  );
}
