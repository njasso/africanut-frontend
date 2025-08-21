import React, { useState } from 'react';
import { FaFacebookF, FaLinkedinIn, FaInstagram, FaWhatsapp, FaEnvelope, FaYoutube } from "react-icons/fa";

// Définition des couleurs de la marque en dehors du composant
const brandColors = {
  brown: '#6F4E37', // Un brun terreux pour le thème principal
  green: '#5E8C61', // Un vert pour les accents
};

export default function App() {
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  // État pour le chargement et le message de statut
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // IMPORTANT: Remplacez cette URL par l'URL de votre fonction Firebase déployée.
  // Vous devrez d'abord créer et déployer une fonction Firebase qui gère les requêtes POST.
  const FIREBASE_FUNCTION_URL = 'VOTRE_URL_DE_FONCTION_ICI';

  // Gère les changements dans les champs de saisie
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Gère la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('Envoi en cours...');

    try {
      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatusMessage('Votre message a été envoyé avec succès !');
        setFormData({ name: '', email: '', message: '' }); // Réinitialise le formulaire
      } else {
        const errorData = await response.json();
        setStatusMessage(`Échec de l'envoi du message : ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du formulaire:', error);
      setStatusMessage('Une erreur est survenue. Veuillez vérifier votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

// Icônes des réseaux sociaux dans un tableau
const socialIcons = [
  { icon: <FaFacebookF size={24} />, url: "https://www.facebook.com/" },
  { icon: <FaLinkedinIn size={24} />, url: "https://www.linkedin.com/" },
  { icon: <FaInstagram size={24} />, url: "https://www.instagram.com" },
  { icon: <FaWhatsapp size={24} />, url: "https://wa.me/237620370286" },
  { icon: <FaEnvelope size={24} />, url: "mailto:africanutindustry@outlook.com" },
  { icon: <FaYoutube size={24} />, url: "https://www.youtube.com/@africanutindustry8157" } // ✅ Ajout de YouTube
];


  return (
    <div className="p-4 max-w-4xl mx-auto font-sans bg-neutral-50 rounded-xl shadow-lg mt-8">
      <h1 className="text-3xl font-bold mb-6 text-brand-brown text-center">Contactez-nous</h1>

      <p className="mb-6 text-neutral-700 text-left">
        Pour toute question, demande de partenariat ou informations supplémentaires, n'hésitez pas à nous contacter via les moyens suivants :
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-8 text-center md:text-left">
        <div className="bg-white p-6 rounded-xl shadow-inner">
          <h2 className="text-2xl font-semibold mb-2 text-brand-brown">Adresse</h2>
          <p className="text-neutral-700">BP 2026 NGALANE, Ebolowa, Cameroun</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-inner">
          <h2 className="text-2xl font-semibold mb-2 text-brand-brown">Téléphone</h2>
          <p className="text-neutral-700">+237 620 370 286</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-inner">
          <h2 className="text-2xl font-semibold mb-2 text-brand-brown">Email</h2>
          <p className="text-neutral-700">africanutindustry@outlook.com</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-inner">
          <h2 className="text-2xl font-semibold mb-2 text-brand-brown">Réseaux sociaux</h2>
          <div className="flex justify-center md:justify-start items-center space-x-4 text-neutral-700">
            {socialIcons.map((item, index) => (
              <a 
                key={index} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-brand-green transition-colors"
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-brand-brown text-left">Formulaire de contact</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="name"
          placeholder="Nom complet"
          value={formData.name}
          onChange={handleChange}
          className="border border-neutral-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Adresse e-mail"
          value={formData.email}
          onChange={handleChange}
          className="border border-neutral-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
          required
        />
        <textarea
          name="message"
          placeholder="Votre message"
          value={formData.message}
          onChange={handleChange}
          className="border border-neutral-300 rounded-xl px-4 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-brand-green"
          required
        />
        <button
          type="submit"
          className="bg-brand-brown text-white font-semibold px-4 py-3 rounded-xl hover:bg-brand-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
        </button>
        {statusMessage && (
          <p className="text-center mt-2 text-sm text-neutral-700">{statusMessage}</p>
        )}
      </form>
    </div>
  );
}
