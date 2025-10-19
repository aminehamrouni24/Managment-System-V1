import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import myLogo from "../../assets/KETHIRI.svg";
import { useNavigate } from "react-router";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/dashboard"); // redirect after successful login
    } catch (err) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4 relative">
      {/* Language Switch */}
      <div className="absolute top-4 right-4 flex gap-2 bg-white rounded-lg p-1 shadow-md">
        <button
          onClick={() => setLanguage("fr")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            language === "fr" ? "bg-green-500 text-white" : "text-gray-600"
          }`}
        >
          Français
        </button>
        <button
          onClick={() => setLanguage("ar")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            language === "ar" ? "bg-green-500 text-white" : "text-gray-600"
          }`}
        >
          العربية
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={myLogo} alt="KETHIRI" className="h-50 w-50 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">KETHIRI</h1>
          <p className="text-gray-600 mt-2">{t.dashboard.title}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t.auth.login}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.auth.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="exemple@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.auth.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="******"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              {loading ? t.common.loading : t.auth.signIn}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
