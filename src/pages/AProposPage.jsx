import React from "react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaWhatsapp,
  FaEnvelope,
  FaYahoo,
  FaYoutube,
} from "react-icons/fa";

export default function AProposPage() {
  // Définition du message pour WhatsApp
  const message =
    "Bonjour AFRICANUT INDUSTRY GROUP, je souhaite avoir plus d’informations.";

  return (
    <div className="p-4">
      <h1 className="text-4xl font-bold mb-6 text-brand-brown">
        À propos de AFRICANUT INDUSTRY GROUP
      </h1>

      {/* Conteneur principal pour le contenu et l'image */}
      <div className="flex flex-col md:flex-row items-start md:space-x-8">
        {/* Conteneur pour le texte */}
        <div className="md:w-2/3 text-justify">
          <p className="mb-4 text-2xl text-neutral-700">
            AFRICANUT INDUSTRY GROUP est un leader dans la gestion et le
            développement des activités industrielles et commerciales. Notre
            mission est de fournir des solutions innovantes et durables pour nos
            clients et partenaires.
          </p>

          <p className="mb-4 text-2xl text-neutral-700">
            Fondée avec une vision claire d’excellence et de transparence, notre
            entreprise met un accent particulier sur le développement durable,
            la qualité de service et la satisfaction client.
          </p>

          {/* Vision */}
          <h2 className="text-2xl font-semibold mt-10 mb-3 text-brand-brown">
            Notre Vision
          </h2>
          <p className="text-2xl text-neutral-700 mb-4 text-justify">
            Être un acteur incontournable dans le secteur industriel, reconnu
            pour l’innovation et l’impact positif sur les communautés.
          </p>

          {/* Missions */}
          <h2 className="text-2xl font-semibold mt-10 mb-3 text-brand-brown">
            Nos missions
          </h2>
          <ul className="text-2xl list-disc list-inside text-neutral-700 space-y-1">
            <li>Développer les projets de production</li>
            <li>Avoir des projets économiquement rentables</li>
            <li>Améliorer nos conditions de vie et celle de nos familles</li>
            <li>Former les jeunes</li>
            <li>Accompagner les porteurs de projets</li>
            <li>Développement culturel</li>
            <li>Réinventer l’éducation des enfants négroafricains</li>
            <li>
              Proposer des modèles de développement des sciences éducatives,
              culturelles pour nos communautés
            </li>
            <li>Créer des emplois</li>
          </ul>

          {/* Valeurs */}
          <h2 className="text-2xl font-semibold mt-10 mb-3 text-brand-brown">
            Nos Valeurs
          </h2>
          <ul className="text-2xl list-disc list-inside text-neutral-700 space-y-1">
            <li>Intégrité et transparence</li>
            <li>Innovation et créativité</li>
            <li>Responsabilité sociale</li>
            <li>Excellence opérationnelle</li>
            <li>Respect des collaborateurs et partenaires</li>
          </ul>

          {/* Zones d'installation */}
          <h2 className="text-2xl font-semibold mt-10 mb-3 text-brand-brown">
            Nos zones d'installation
          </h2>
          <ul className="text-2xl list-disc list-inside text-neutral-700 space-y-1">
            <li>Yaoundé</li>
            <li>Ebolowa</li>
            <li>Kribi</li>
            <li>Njombe</li>
          </ul>

          {/* Réseaux sociaux */}
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4 text-brand-brown text-left">
              Nos réseaux sociaux
            </h2>
            <div className="flex justify-left mt-10 items-center space-x-6">
              <a
                href="https://www.facebook.com/share/16xG8Ujae9/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-brown hover:text-blue-600 transition-colors"
              >
                <FaFacebookF size={36} />
              </a>
              <a
                href="https://www.linkedin.com/in/felix-magloire-essola-onja-a-9a37b8354"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-brown hover:text-blue-800 transition-colors"
              >
                <FaLinkedinIn size={36} />
              </a>
              <a
                href="https://www.instagram.com/africanut_industry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-brown hover:text-pink-600 transition-colors"
              >
                <FaInstagram size={36} />
              </a>
              <a
                href={`https://wa.me/237620370286?text=${encodeURIComponent(
                  message
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-brown hover:text-green-500 transition-colors"
              >
                <FaWhatsapp size={36} />
              </a>
              <a
                href="mailto:efelixmagloire@yahoo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-brown hover:text-purple-600 transition-colors"
              >
                <FaYahoo size={36} />
              </a>
              <a
                href="mailto:africanutindustry@outlook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-brown hover:text-blue-500 transition-colors"
              >
                <FaEnvelope size={36} />
              </a>
              <a
                href="https://www.youtube.com/@africanutindustry8157"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-brown hover:text-red-600 transition-colors"
              >
                <FaYoutube size={36} />
              </a>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="md:w-2/3 mt-6 md:mt-0">
          <img
            src="/images/Artboard 3@4x-100.jpg"
            alt="Groupe AFRICANUT INDUSTRY"
            className="w-full h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
