import { Link } from 'react-router-dom'

export default function CompanyCard({ company }) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3">
      {/* Conteneur pour le logo et les informations de base */}
      <div className="flex items-start justify-between gap-3">
        {/* Conteneur pour le logo */}
        {company.logo && (
          <img
            src={company.logo}
            alt={`Logo de ${company.name}`}
            // La classe object-cover a été supprimée pour éviter le rognage
            className="w-16 h-16 max-w-full h-auto"
          />
        )}
        {/* Conteneur pour le nom et le slogan */}
        <div>
          <h3 className="text-lg font-semibold">{company.name}</h3>
          <p className="text-sm text-neutral-600">{company.tagline}</p>
        </div>
        {/* Conteneur pour le secteur */}
        <span className="px-2 py-1 rounded-lg text-1x bg-brand-green/10 text-brand-green border border-brand-green/20">
          {company.sector}
        </span>
      </div>

      <p className="text-x1 leading-6">{company.description}</p>

      <div className="flex gap-2 pt-2">
        <Link
          to={`/entreprises/${company.slug}`}
          className="px-3 py-2 rounded-xl bg-brand-brown text-white text-sm hover:opacity-95"
        >
          Accéder à la page
        </Link>

        {/* ✅ Boutique fixe pour toutes les entreprises */}
        <Link
          to="/entreprises/africanut-industry/boutique"
          className="px-3 py-2 rounded-xl border text-sm hover:bg-neutral-50"
        >
          Boutique
        </Link>
      </div>
    </div>
  )
}
