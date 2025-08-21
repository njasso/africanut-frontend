import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// Assurez-vous que les variables globales sont disponibles.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Composant de modal générique
const Modal = ({ isOpen, children, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-neutral-800 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl transform transition-transform duration-300 scale-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

// Composant de formulaire pour ajouter ou modifier un webinaire
const WebinarForm = ({ onSuccess, onCancel, existingWebinar }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImageUrl: '',
    videoUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Remplir le formulaire si on est en mode modification
  useEffect(() => {
    if (existingWebinar) {
      setFormData(existingWebinar);
    } else {
      setFormData({
        title: '',
        description: '',
        coverImageUrl: '',
        videoUrl: ''
      });
    }
  }, [existingWebinar]);

  // Gère les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // Gère la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (existingWebinar) {
        // Mode modification : met à jour le document existant
        const webinarDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'webinars', existingWebinar.id);
        await updateDoc(webinarDocRef, formData);
        setMessage('Webinaire modifié avec succès !');
      } else {
        // Mode ajout : ajoute un nouveau document
        const webinarsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'webinars');
        await addDoc(webinarsCollectionRef, {
          ...formData,
          // Génère une image par défaut si aucune URL n'est fournie
          coverImageUrl: formData.coverImageUrl || `https://placehold.co/600x400/808080/FFFFFF?text=${encodeURIComponent(formData.title.split(' ')[0] || 'Webinar')}`
        });
        setMessage('Webinaire ajouté avec succès !');
      }
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la soumission du webinaire:', error);
      setMessage(`Erreur: Impossible d’ajouter le webinaire. (${error.message})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto font-sans">
      <h2 className="text-2xl font-bold mb-6 text-neutral-800 text-center">
        {existingWebinar ? 'Modifier le Webinaire' : 'Ajouter un nouveau Webinaire'}
      </h2>
      
      {message && (
        <div className={`p-3 rounded-lg text-center mb-4 ${
          message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-neutral-700">Titre</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700">Description courte</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="3"
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"
          ></textarea>
        </div>
        <div>
          <label htmlFor="coverImageUrl" className="block text-sm font-medium text-neutral-700">URL de l'image de couverture</label>
          <input
            type="url"
            id="coverImageUrl"
            name="coverImageUrl"
            value={formData.coverImageUrl}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"
          />
        </div>
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-neutral-700">URL de la vidéo</label>
          <input
            type="url"
            id="videoUrl"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"
          />
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 rounded-md text-neutral-800 font-semibold transition-colors duration-200 border border-neutral-300 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200
              bg-brand-brown hover:bg-brand-green focus:outline-none focus:ring-2 focus:ring-brand-brown focus:ring-opacity-50 disabled:bg-neutral-400"
          >
            {loading ? 'Sauvegarde en cours...' : (existingWebinar ? 'Modifier le Webinaire' : 'Ajouter le Webinaire')}
          </button>
        </div>
      </form>
    </div>
  );
};

// Le composant App principal qui gère la page complète
export default function App() {
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState(null);
  const [userId, setUserId] = useState(null);
  // État pour gérer la modal de confirmation de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [webinarToDelete, setWebinarToDelete] = useState(null);

  // Authentification et écoute des données de Firestore
  useEffect(() => {
    const setupFirebase = async () => {
      // Authentification
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Erreur lors de l'authentification:", e);
      }

      // Écoute des données une fois l'authentification réussie
      const webinarsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'webinars');
      
      const unsubscribeSnapshot = onSnapshot(webinarsCollectionRef, (snapshot) => {
        const webinarsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWebinars(webinarsData);
        setLoading(false);
      }, (e) => {
        console.error("Erreur lors de la récupération des webinaires:", e);
        setError("Impossible de charger les webinaires. Veuillez vérifier la connexion au serveur.");
        setLoading(false);
      });

      // Nettoyage du listener
      return unsubscribeSnapshot;
    };

    const unsubscribe = setupFirebase();
    
    // Nettoyage de la souscription Firestore lors du démontage du composant
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Fonction pour gérer la suppression d'un webinaire
  const handleDeleteWebinar = (webinar) => {
    setWebinarToDelete(webinar);
    setIsDeleteModalOpen(true);
  };

  // Fonction pour confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!webinarToDelete) return;
    try {
      const webinarDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'webinars', webinarToDelete.id);
      await deleteDoc(webinarDocRef);
      console.log("Webinaire supprimé avec succès !");
      setIsDeleteModalOpen(false);
      setWebinarToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du webinaire:", error);
      setIsDeleteModalOpen(false);
      setWebinarToDelete(null);
    }
  };

  // Fonction pour ouvrir le formulaire en mode modification
  const handleEditWebinar = (webinar) => {
    setEditingWebinar(webinar);
    setIsFormModalOpen(true);
  };

  // Fonction de succès du formulaire
  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingWebinar(null);
  };

  const handleOpenAddModal = () => {
    setEditingWebinar(null); // S'assurer que le formulaire est en mode ajout
    setIsFormModalOpen(true);
  };

  if (error) {
    return <div className="text-center p-8 text-red-500">Erreur: {error}</div>;
  }
  
  // Utilise onAuthStateChanged pour obtenir l'ID utilisateur et le mettre à jour en temps réel
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return unsubscribeAuth;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8 text-neutral-800">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-neutral-900 mb-2 text-center">Webinaires & Ressources</h1>
          <p className="text-center text-lg text-neutral-600">
            Découvrez nos webinaires pour approfondir vos connaissances.
          </p>
        </header>

        <section className="mb-8 flex flex-col items-center">
          <button
            onClick={handleOpenAddModal}
            className="py-3 px-6 rounded-full text-white font-semibold shadow-lg transition-transform transform hover:scale-105 duration-200
                        bg-brand-brown hover:bg-brand-green focus:outline-none focus:ring-4 focus:ring-brand-brown focus:ring-opacity-50"
          >
            Ajouter un nouveau Webinaire
          </button>
          {userId && (
            <div className="mt-4 p-2 text-sm text-neutral-500 bg-neutral-100 rounded-lg">
              Votre ID utilisateur (pour le partage) : <strong>{userId}</strong>
            </div>
          )}
        </section>

        {/* Liste des webinaires */}
        {loading ? (
          <p className="text-center text-neutral-500">Chargement des webinaires...</p>
        ) : webinars.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <p className="text-neutral-600 text-lg">Aucun webinaire n'a encore été publié.</p>
            <p className="text-sm text-neutral-500 mt-2">Veuillez en ajouter un via le formulaire.</p>
          </div>
        ) : (
          <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {webinars.map(webinar => (
              <div
                key={webinar.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <img
                  src={webinar.coverImageUrl || "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Webinar"}
                  alt={webinar.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Image+introuvable"; }}
                />
                <div className="p-5">
                  <h2 className="text-xl font-bold text-neutral-900 truncate">{webinar.title}</h2>
                  <p className="mt-2 text-neutral-600 text-sm line-clamp-3">{webinar.description}</p>
                  <div className="mt-4 flex justify-between space-x-2">
                    <a
                      href={webinar.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-4 bg-brand-brown text-white font-semibold rounded-lg hover:bg-brand-green transition-colors text-center"
                    >
                      Regarder
                    </a>
                    <button
                      onClick={() => handleEditWebinar(webinar)}
                      className="py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteWebinar(webinar)}
                      className="py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </main>
        )}

        {/* Modal de la vidéo */}
        <Modal isOpen={selectedWebinar !== null} onClose={() => setSelectedWebinar(null)}>
          {selectedWebinar && (
            <div className="w-full">
              <h2 className="text-2xl font-bold text-neutral-800 mb-4">{selectedWebinar.title}</h2>
              <div className="relative pt-[56.25%] mb-4">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={selectedWebinar.videoUrl}
                  title={selectedWebinar.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="text-neutral-600">{selectedWebinar.description}</p>
            </div>
          )}
        </Modal>

        {/* Modal du formulaire d'ajout/modification */}
        <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
          <WebinarForm onSuccess={handleFormSuccess} onCancel={() => setIsFormModalOpen(false)} existingWebinar={editingWebinar} />
        </Modal>

        {/* Modal de confirmation de suppression */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
          <div className="text-center p-4">
            <h3 className="text-xl font-bold mb-4">Confirmer la suppression</h3>
            <p className="text-neutral-700">Êtes-vous sûr de vouloir supprimer ce webinaire ?</p>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="py-2 px-4 rounded-md text-neutral-800 font-semibold transition-colors duration-200 border border-neutral-300 hover:bg-neutral-100"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200 bg-red-500 hover:bg-red-600"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
