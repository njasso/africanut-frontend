// src/components/Login.js
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard'); // or wherever you want to redirect
      } else {
        setError(result.message || 'Échec de la connexion');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Handle different types of errors
      if (err.message?.includes('404')) {
        setError('Service non disponible. Veuillez réessayer plus tard.');
      } else if (err.message?.includes('401')) {
        setError('Email ou mot de passe incorrect');
      } else if (err.message?.includes('Network')) {
        setError('Erreur de connexion. Vérifiez votre internet.');
      } else {
        setError(err.message || 'Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
    >
      <div className="max-w-sm w-full glass rounded-2xl p-6 bg-white/80 shadow-lg backdrop-blur-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Connexion</h2>
          <p className="text-sm text-gray-600 mt-2">Accédez à votre compte</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-brown focus:border-transparent"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-brown focus:border-transparent"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all duration-200 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-brand-brown hover:bg-opacity-90 hover:shadow-lg'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Connexion...
              </div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-brand-brown hover:underline">
            Mot de passe oublié ?
          </a>
        </div>
      </div>
    </div>
  );
}
