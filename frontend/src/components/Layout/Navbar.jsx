import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import myLogo from "../../../assets/KETHIRI.svg";

export function Navbar({ onMenuClick }) {
  const { userProfile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-40">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <img src= {myLogo} alt="Logo" className="h-10 w-10" />
            <h1 className="text-xl font-bold text-green-600">KETHIRI</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setLanguage("fr")} className={language === "fr" ? "bg-white px-3 py-1 rounded text-green-600" : "px-3 py-1"}>FR</button>
            <button onClick={() => setLanguage("ar")} className={language === "ar" ? "bg-white px-3 py-1 rounded text-green-600" : "px-3 py-1"}>AR</button>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span className="text-sm">{userProfile?.name}</span>
          </div>
          <button onClick={signOut} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
