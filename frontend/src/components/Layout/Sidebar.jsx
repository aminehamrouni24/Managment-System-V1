// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  UserCircle,
  FileText,
  TrendingUp,
  Container,
  Clipboard,
  X,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useLocation, useNavigate } from "react-router";

export function Sidebar() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: t.nav.dashboard },
    { path: "/products", icon: Package, label: t.nav.products },
    { path: "/suppliers", icon: Users, label: t.nav.suppliers },
    { path: "/customers", icon: UserCircle, label: t.nav.customers },
    { path: "/shipment", icon: Container, label: t.nav.shipment },
    { path: "/client", icon: Clipboard, label: t.nav.client },
    { path: "/partners", icon: FileText, label: t.nav.partners },
    { path: "/bondelivraison", icon: FileText, label: t.nav.bondelivraison },
    { path: "/bordereau", icon: FileText, label: t.nav.bordereau },
    { path: "/stock", icon: TrendingUp, label: t.nav.stock },
  ];

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 1024);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // fermer menu si on passe en desktop
  useEffect(() => {
    if (!isMobile) setIsOpen(false);
  }, [isMobile]);

  // empêcher scroll quand menu mobile ouvert & fermer avec Escape
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";

    function onKey(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Ecoute l'event global 'toggleSidebar' dispatché par la Navbar
  useEffect(() => {
    function onToggle() {
      setIsOpen((s) => !s);
    }
    window.addEventListener("toggleSidebar", onToggle);
    return () => window.removeEventListener("toggleSidebar", onToggle);
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* overlay mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={
          "fixed lg:sticky top-0 h-screen bg-white border-r w-64 transform transition-transform z-50 " +
          (isMobile
            ? isOpen
              ? "translate-x-0"
              : isRTL
              ? "translate-x-full"
              : "-translate-x-full"
            : "translate-x-0")
        }
        aria-hidden={!isMobile ? "false" : isOpen ? "false" : "true"}
      >
        <div className="flex flex-col h-full">
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b lg:hidden">
              <h2 className="text-lg font-semibold">{t.nav.home}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

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

          <div className="p-4 border-t text-center text-xs text-gray-500">
            <p>© 2025 KETHIRI</p>
          </div>
        </div>
      </aside>

      {/* NOTE: PLUS DE BOUTON VERT FLOTTANT ICI */}
    </>
  );
}

export default Sidebar;
