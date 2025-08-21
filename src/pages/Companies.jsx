import CompanyCard from '../components/CompanyCard.jsx'
import { companies } from '../data/companies.js'

// Définition du composant Companies
export default function Companies(){
  return (
    // Section principale avec fond et espacement
    <section 
        className="relative min-h-screen px-4 md:px-16 py-8"
        style={{
            backgroundImage: 'url(https://res.cloudinary.com/djhyztec8/image/upload/v1755539480/pexels-goumbik-1420709_jojkah.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}
    >
      {/* Superposition sombre pour assurer la lisibilité du texte et des cartes */}
      <div className="absolute inset-0 bg-gray opacity-20"></div>
      
      {/* Contenu principal de la page, surmontant la superposition */}
      <div className="relative z-10">
        {/* En-tête de la section */}
        <header className="space-y-2 mb-8 text-gray">
          <h2 className="text-3xl font-bold">Les entreprises du Groupe</h2>
          <p className="text-xl text-white-300">Accédez à la page de chaque entité, à ses projets, offres et produits.</p>
        </header>
        
        {/* Grille pour afficher les cartes des entreprises */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Parcours le tableau d'entreprises pour générer une CompanyCard pour chaque */}
          {companies.map(c => (
            <div key={c.slug} className="backdrop-blur-sm bg-white/10 rounded-2xl shadow-xl p-6">
              <CompanyCard company={c} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
