import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('user')
  const [password, setPassword] = useState('password')
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      nav('/')
    } catch (e) {
      setErr('Connexion échouée')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/login-bg.jpg')" }} // Mets ton image dans public/images
    >
      <div className="max-w-sm w-full glass rounded-2xl p-6 bg-white/80 shadow-lg">
        <h2 className="text-xl font-semibold mb-3 text-center">Connexion</h2>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Email ou utilisateur"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-xl px-3 py-2"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button
            className="px-4 py-2 rounded-xl bg-brand-brown text-white w-full hover:opacity-90 transition"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
