import { Link } from 'react-router-dom'
export default function NotFound(){
  return (
    <div className="min-h-[50vh] grid place-items-center text-center">
      <div>
        <h1 className="text-5xl font-extrabold mb-3">404</h1>
        <p className="text-neutral-600 mb-6">Page introuvable</p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-brand-brown text-white">Retour à l'accueil</Link>
      </div>
    </div>
  )
}
