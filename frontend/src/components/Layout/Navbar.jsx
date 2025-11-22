 
import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
// Remplace le logo import par le chemin local si tu préfères
// (j'ai mis l'image que tu as uploadée dans la conversation)
 import myLogo from "../../../assets/KETHIRI.svg";

export function Navbar({ onMenuClick }) {
  const { userProfile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // si on passe une callback on l'utilise, sinon on dispatch l'event global
  function handleMenuClick() {
    if (typeof onMenuClick === "function") {
      onMenuClick();
      return;
    }
    // dispatch global event that Sidebar listens to ("toggleSidebar")
    const ev = new Event("toggleSidebar");
    window.dispatchEvent(ev);
  }

  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-40">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* hamburger: visible only on mobile (lg:hidden) */}
          <button
            onClick={handleMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            {/* Use the uploaded local logo if available; you can restore original import if preferred */}
            <img
              src={myLogo}
              alt="Logo"
              className="h-10 w-10 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <h1 className="text-xl font-bold text-green-600">KETHIRI</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLanguage("fr")}
              className={
                language === "fr"
                  ? "bg-white px-3 py-1 rounded text-green-600"
                  : "px-3 py-1"
              }
            >
              FR
            </button>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span className="text-sm">{userProfile?.name}</span>
          </div>

          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
