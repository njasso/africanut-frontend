import { useParams, Link } from 'react-router-dom';
import { companies } from '../data/companies.js';
import { useState, useEffect } from 'react';

export default function Company() {
  const { slug } = useParams();
  const company = companies.find(c => c.slug === slug);
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!company) {
    return <div className="p-8">Entreprise introuvable.</div>;
  }

  const openLightbox = (index) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const prevImage = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) =>
      prev === 0 ? company.images.length - 1 : prev - 1
    );
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) =>
      prev === company.images.length - 1 ? 0 : prev + 1
    );
  };

  // Gestion clavier pour navigation et fermeture
  useEffect(() => {
    const handleKey = (e) => {
      if (selectedIndex !== null) {
        if (e.key === 'ArrowLeft') prevImage(e);
        if (e.key === 'ArrowRight') nextImage(e);
        if (e.key === 'Escape') closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex]);

  return (
    <section className="space-y-6 p-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <img
            src={company.logo}
            alt={`Logo ${company.name}`}
            className="h-16 w-16 object-contain rounded-lg"
          />
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <p className="text-neutral-600">{company.tagline}</p>
          </div>
        </div>

        <Link
          to={`/entreprises/${company.slug}/boutique`}
          className="px-4 py-2 rounded-xl bg-brand-green text-white hover:bg-green-700 transition"
        >
          Accéder à la boutique
        </Link>
      </header>

      {/* Description */}
      <p className="text-lg">{company.description}</p>

      {/* Produits / Services / Expertise */}
      <div className="grid md:grid-cols-3 gap-5">
        <Card title="Produits & Services" items={company.products} />
        <Card title="Services / Prestations" items={company.services} />
        <Card title="Expertise" items={company.expertise} />
      </div>

      {/* Projets */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-2">Projets</h3>
        <ProjectsCard projects={company.projects} />
      </div>

      {/* Galerie */}
      {/* Galerie */}
{company.images && company.images.length > 0 && (
  <div className="glass rounded-2xl p-5">
    <h3 className="font-semibold mb-3">Galerie</h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {company.images.map((img, index) => (
        <div
          key={index}
          className="w-full h-40 sm:h-48 md:h-56 flex items-center justify-center bg-gray-100 rounded-lg cursor-pointer hover:opacity-90 transition"
          onClick={() => setSelectedImage(img)}
        >
          <img
            src={img}
            alt={`Image ${index + 1} de ${company.name}`}
            className="max-w-full max-h-full object-contain"
            onClick={() => openLightbox(index)}
          />
        </div>
      ))}
    </div>
  </div>
)}


      {/* Lightbox plein écran */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
          onClick={closeLightbox}
        >
          {/* Bouton gauche */}
          <button
            className="absolute left-5 text-white text-3xl font-bold z-50"
            onClick={prevImage}
          >
            ←
          </button>

          <img
            src={company.images[selectedIndex]}
            alt={`Agrandissement`}
            className="max-w-[90%] max-h-[90%] object-contain rounded-lg shadow-lg"
          />

          {/* Bouton droit */}
          <button
            className="absolute right-5 text-white text-3xl font-bold z-50"
            onClick={nextImage}
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}

// Composants Card et ProjectsCard identiques
function Card({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      <ul className="space-y-2 list-disc list-inside text-sm">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

function ProjectsCard({ projects }) {
  if (!projects || projects.length === 0) return <p>Aucun projet pour le moment.</p>;
  return (
    <ul className="space-y-4">
      {projects.map((project, index) => (
        <li key={index} className="border-b pb-2 last:border-b-0">
          <h4 className="font-medium">{project.title}</h4>
          <p className="text-sm text-neutral-600">
            Statut : <span className="font-medium text-brand-brown">{project.status}</span>
          </p>
          <p className="text-sm text-neutral-600">
            Budget : <span className="font-medium text-brand-brown">{project.budget.toLocaleString()} F CFA</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
