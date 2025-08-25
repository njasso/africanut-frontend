import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        navigate('/') // redirection vers la page principale
      } else {
        setError(result.message || 'Connexion échouée')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion échouée')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/login-bg.jpg')" }} // Mets ton image dans public/images
    >
      <div className="max-w-sm w-full glass rounded-2xl p-6 bg-white/80 shadow-lg">
        <h2 className="text-xl font-semibold mb-3 text-center">Connexion</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Email ou utilisateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border rounded-xl px-3 py-2"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-brand-brown text-white w-full hover:opacity-90 transition"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
