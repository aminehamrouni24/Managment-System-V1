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
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export function Sidebar({ isOpen, onClose, currentPage, onNavigate }) {
  const { t, isRTL } = useLanguage();
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: t.nav.dashboard },
    { id: "products", icon: Package, label: t.nav.products },
    { id: "suppliers", icon: Users, label: t.nav.suppliers },
    { id: "customers", icon: UserCircle, label: t.nav.customers },
    { id: "invoices", icon: FileText, label: t.nav.invoices },
    { id: "stock", icon: TrendingUp, label: t.nav.stock },
    { id: "reports", icon: BarChart3, label: t.nav.reports },
    { id: "exports", icon: Download, label: t.nav.exports },
    { id: "settings", icon: Settings, label: t.nav.settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
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
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <h2 className="text-lg font-semibold">{t.nav.home}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all " +
                        (isActive
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-gray-100")
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t text-center text-xs text-gray-500">
            <p>© 2025 KETHIRI</p>
          </div>
        </div>
      </aside>
    </>
  );
}
