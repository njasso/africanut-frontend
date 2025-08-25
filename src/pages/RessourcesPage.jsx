import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';

// Configuration d'environnement
// Utilisation de l'URL du backend Railway directement pour la démonstration
const API_BASE_URL = "https://africanut-backend-postgres-production.up.railway.app";
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';


// Composant Modal
const Modal = ({ isOpen, children, onClose }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-800 transition-colors"
                    aria-label="Fermer la modale"
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

// Utilitaires
const getEmbedUrl = (url) => {
    if (!url) return "";
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/;
    const shortRegex = /(?:https?:\/\/)?youtu\.be\/([^?]+)/;
    
    let match = url.match(youtubeRegex) || url.match(shortRegex);
    
    if (match && match[1]) {
        // Correction de la syntaxe du template literal
        return `http://googleusercontent.com/youtube.com/${match[1]}`;
    }

    return url;
};

// Composant ConfirmationModal
const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel, title }) => {
    if (!isOpen) return null;
    
    return (
        <Modal isOpen={isOpen} onClose={onCancel}>
            <div className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-4 text-neutral-900">{title}</h3>
                <p className="mb-6 text-neutral-700">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Confirmer
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-neutral-200 text-neutral-800 rounded-md hover:bg-neutral-300 transition-colors"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// Composant ResourceForm
const ResourceForm = ({ resourceName, onSuccess, onCancel, formFields }) => {
    const initialData = formFields.reduce((acc, field) => ({ ...acc, [field.name]: field.type === 'checkbox' ? false : '' }), {});
    const [formData, setFormData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const { isAuthenticated } = useAuth();
    // Utilisation de la variable d'environnement pour l'endpoint
    const apiEndpoint = `${API_BASE_URL}/api/${resourceName}`;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!isAuthenticated) {
            setMessage('Authentification requise');
            setLoading(false);
            return;
        }

        try {
            const authToken = localStorage.getItem("token");
            if (!authToken) throw new Error("Jeton d'authentification manquant.");

            const dataToSend = { ...formData };
            if (dataToSend.categories && typeof dataToSend.categories === 'string') {
                dataToSend.categories = dataToSend.categories.split(',').map(s => s.trim());
            }
            if (dataToSend.tags && typeof dataToSend.tags === 'string') {
                dataToSend.tags = dataToSend.tags.split(',').map(s => s.trim());
            }
            if (dataToSend.category && typeof dataToSend.category === 'string') {
                dataToSend.category = dataToSend.category.split(',').map(s => s.trim());
            }


            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Erreur serveur');
            }

            const newResource = await response.json();
            onSuccess(newResource);
            setMessage('Ajout réussi !');
            setFormData(initialData);
        } catch (error) {
            console.error('Erreur:', error);
            setMessage(`Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Ajouter un {resourceName.replace(/-/g, ' ')}</h2>
            
            {message && (
                <div className={`p-3 mb-4 rounded-lg text-center ${
                    message.includes('réussi') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {formFields.map(field => (
                    <div key={field.name} className="space-y-1">
                        <label htmlFor={field.name} className="block text-sm font-medium text-neutral-700">
                            {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                            <textarea
                                id={field.name}
                                name={field.name}
                                value={formData[field.name]}
                                onChange={handleChange}
                                required={field.required}
                                rows={field.rows || 3}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
                            />
                        ) : field.type === 'checkbox' ? (
                            <input
                                type="checkbox"
                                id={field.name}
                                name={field.name}
                                checked={formData[field.name]}
                                onChange={handleChange}
                                className="h-4 w-4 text-brand-brown rounded"
                            />
                        ) : (
                            <input
                                type={field.type}
                                id={field.name}
                                name={field.name}
                                value={formData[field.name]}
                                onChange={handleChange}
                                required={field.required}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
                            />
                        )}
                    </div>
                ))}

                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !isAuthenticated}
                        className="px-4 py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green disabled:bg-neutral-400"
                    >
                        {loading ? 'Envoi...' : 'Ajouter'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Composant ResourceList
const ResourceList = ({ resourceName, renderCard, renderModalContent, formFields, placeholder, canDelete = true }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedResource, setSelectedResource] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState(null);

    const { isAuthenticated } = useAuth();
    // Utilisation de la variable d'environnement pour l'endpoint
    const apiEndpoint = `${API_BASE_URL}/api/${resourceName}`;

 useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await fetch(apiEndpoint);
                if (!response.ok) throw new Error(`Erreur ${response.status}`);
                const data = await response.json();
                setResources(data);
            } catch (err) {
                console.error('Erreur:', err);
                setError("Impossible de charger les ressources");
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [apiEndpoint, resourceName]);
    const handleAddSuccess = (newResource) => {
        setResources(prev => [...prev, newResource]);
        setIsFormModalOpen(false);
    };

    const handleDelete = (resource) => {
        setResourceToDelete(resource);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!resourceToDelete) return;
        setIsConfirmModalOpen(false);

        try {
            const authToken = localStorage.getItem("token");
            if (!authToken) throw new Error("Jeton d'authentification manquant pour la suppression.");

            const response = await fetch(`${apiEndpoint}/${resourceToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Échec de la suppression');
            }

            setResources(prev => prev.filter(r => r.id !== resourceToDelete.id));
            setResourceToDelete(null);
        } catch (err) {
            console.error('Erreur:', err);
            alert(`Erreur: ${err.message}`);
        }
    };

    if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="w-full mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">Ressources {resourceName.replace(/-/g, ' ')}</h1>
                
                {isAuthenticated && (
                    <div className="text-center mb-8">
                        <button
                            onClick={() => setIsFormModalOpen(true)}
                            className="px-6 py-3 bg-brand-brown text-white rounded-full shadow-lg hover:bg-brand-green transition-all"
                        >
                            + Ajouter un {resourceName.replace(/-/g, ' ')}
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-neutral-500">Chargement en cours...</p>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="p-8 rounded-xl shadow text-center">
                        <p className="text-neutral-600">Aucune ressource disponible</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {resources.map(resource => (
                            <div
                                key={resource.id}
                                className="rounded-xl shadow-md overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-200"
                            >
                                <div className="h-48 overflow-hidden">
                                    <img
                                        src={resource.coverImageUrl || resource.imageUrl || placeholder}
                                        alt={resource.title || 'Image de couverture'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.src = placeholder; }}
                                    />
                                </div>
                                <div className="p-6 relative">
                                    {renderCard(resource, setSelectedResource)}
                                    {isAuthenticated && canDelete && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(resource); }}
                                            className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                            aria-label="Supprimer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Modal isOpen={selectedResource !== null} onClose={() => setSelectedResource(null)}>
                    {selectedResource && renderModalContent(selectedResource)}
                </Modal>

                <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
                    <ResourceForm
                        resourceName={resourceName}
                        formFields={formFields}
                        onSuccess={handleAddSuccess}
                        onCancel={() => setIsFormModalOpen(false)}
                    />
                </Modal>

                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    title="Confirmer la suppression"
                    message={`Voulez-vous vraiment supprimer "${resourceToDelete?.title}" ?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setIsConfirmModalOpen(false)}
                />
            </div>
        </div>
    );
    };

// Composants spécifiques pour chaque type de ressource

function WebinarList() {
    const defaultCover = "https://res.cloudinary.com/djhyztec8/image/upload/v1755443271/30177_lx6p9n.jpg";
    const formFields = [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'coverImageUrl', label: "URL de l'image", type: 'url' },
        { name: 'videoUrl', label: 'URL vidéo', type: 'url', required: true }
    ];

    const renderCard = (webinar, setSelectedWebinar) => (
        <>
            <h3 className="font-bold text-xl mb-2">{webinar.title}</h3>
            <p className="text-neutral-600 mb-4 line-clamp-3">{webinar.description}</p>
            <button
                onClick={() => setSelectedWebinar(webinar)}
                className="w-full py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green"
            >
                Voir le webinaire
            </button>
        </>
    );

    const renderModalContent = (webinar) => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">{webinar.title}</h2>
            <div className="aspect-w-16 aspect-h-9">
                <iframe
                    className="w-full h-96 rounded-lg"
                    src={getEmbedUrl(webinar.videoUrl)}
                    title={webinar.title}
                    allowFullScreen
                />
            </div>
            <p className="text-neutral-700">{webinar.description}</p>
        </div>
    );

    return (
        <ResourceList
            resourceName="webinars"
            renderCard={renderCard}
            renderModalContent={renderModalContent}
            formFields={formFields}
            placeholder={defaultCover}
        />
    );
}

function ArticleList() {
    const defaultCover = "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Article";
    const formFields = [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'slug', label: 'Slug (URL)', type: 'text', required: true },
        { name: 'authorName', label: 'Auteur', type: 'text', required: true },
        { name: 'excerpt', label: 'Résumé', type: 'textarea', required: true },
        { name: 'content', label: 'Contenu', type: 'textarea', rows: 6, required: true },
        { name: 'categories', label: 'Catégories (séparées par des virgules)', type: 'text' },
        { name: 'tags', label: 'Tags (séparés par des virgules)', type: 'text' },
        { name: 'published', label: 'Publié ?', type: 'checkbox' }
    ];

    const renderCard = (article, setSelectedArticle) => (
        <>
            <h3 className="font-bold text-xl mb-2">{article.title}</h3>
            <p className="text-sm text-neutral-500 mb-1">Par {article.authorName}</p>
            <p className="text-neutral-600 mb-4 line-clamp-3">{article.excerpt}</p>
            <button
                onClick={() => setSelectedArticle(article)}
                className="w-full py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green"
            >
                Lire l'article
            </button>
        </>
    );

    const renderModalContent = (article) => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">{article.title}</h2>
            <p className="text-sm text-neutral-500">Par {article.authorName}</p>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
    );

    return (
        <ResourceList
            resourceName="articles"
            renderCard={renderCard}
            renderModalContent={renderModalContent}
            formFields={formFields}
            placeholder={defaultCover}
        />
    );
}

function LivreBlancList() {
    const defaultCover = "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Livre+Blanc";
    const formFields = [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'imageUrl', label: "URL de l'image de couverture", type: 'url' },
        { name: 'fileUrl', label: 'URL du PDF', type: 'url', required: true },
        { name: 'category', label: 'Catégories (séparées par des virgules)', type: 'text' }
    ];

    const renderCard = (livreBlanc, setSelectedLivreBlanc) => (
        <>
            <h3 className="font-bold text-xl mb-2">{livreBlanc.title}</h3>
            <p className="text-neutral-600 mb-4 line-clamp-3">{livreBlanc.description}</p>
            <a
                href={livreBlanc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green text-center"
            >
                Télécharger
            </a>
        </>
    );

    const renderModalContent = (livreBlanc) => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">{livreBlanc.title}</h2>
            <p className="text-neutral-700">{livreBlanc.description}</p>
            <a
                href={livreBlanc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green"
            >
                Télécharger le PDF
            </a>
        </div>
    );

    return (
        <ResourceList
            resourceName="livre-blanc"
            renderCard={renderCard}
            renderModalContent={renderModalContent}
            formFields={formFields}
            placeholder={defaultCover}
        />
    );
}

function BrochuresList() {
    const defaultCover = "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Brochure";
    const formFields = [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'imageUrl', label: "URL de l'image", type: 'url' },
        { name: 'fileUrl', label: 'URL du fichier', type: 'url', required: true },
        { name: 'language', label: 'Langue', type: 'text' }
    ];

    const renderCard = (brochure, setSelectedBrochure) => (
        <>
            <h3 className="font-bold text-xl mb-2">{brochure.title}</h3>
            <p className="text-neutral-600 mb-4 line-clamp-3">{brochure.description}</p>
            <a
                href={brochure.fileUrl} 
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green text-center"
            >
                Télécharger
            </a>
        </>
    );

    const renderModalContent = (brochure) => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">{brochure.title}</h2>
            <p className="text-neutral-700">{brochure.description}</p>
            <a
                href={brochure.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green"
            >
                Télécharger
            </a>
        </div>
    );

    return (
        <ResourceList
            resourceName="brochures"
            renderCard={renderCard}
            renderModalContent={renderModalContent}
            formFields={formFields}
            placeholder={defaultCover}
        />
    );
}

function CommuniquesList() {
    const defaultCover = "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Communiqué";
    const formFields = [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'content', label: 'Contenu', type: 'textarea', rows: 6, required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'fileUrl', label: 'URL du fichier', type: 'url' },
        { name: 'isImportant', label: 'Important', type: 'checkbox' }
    ];

    const renderCard = (communique, setSelectedCommunique) => (
        <>
            <h3 className="font-bold text-xl mb-2">{communique.title}</h3>
            <p className="text-sm text-neutral-500 mb-1">{new Date(communique.date).toLocaleDateString()}</p>
            <p className="text-neutral-600 mb-4 line-clamp-3">{communique.content}</p>
            <button
                onClick={() => setSelectedCommunique(communique)}
                className="w-full py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green"
            >
                Lire
            </button>
        </>
    );

    const renderModalContent = (communique) => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">{communique.title}</h2>
            <p className="text-sm text-neutral-500">{new Date(communique.date).toLocaleDateString()}</p>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: communique.content }} />
        </div>
    );

    return (
        <ResourceList
            resourceName="communiques"
            renderCard={renderCard}
            renderModalContent={renderModalContent}
            formFields={formFields}
            placeholder={defaultCover}
        />
    );
}

function MediathequeList() {
    const defaultCover = "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Média";
    const formFields = [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'type', label: 'Type de média', type: 'text', required: true },
        { name: 'url', label: "URL du média", type: 'url', required: true },
        { name: 'thumbnailUrl', label: "URL de la miniature", type: 'url' },
        { name: 'category', label: 'Catégorie', type: 'text' }
    ];

    const renderCard = (media, setSelectedMedia) => (
        <>
            <h3 className="font-bold text-xl mb-2">{media.title}</h3>
            <p className="text-neutral-600 mb-4 line-clamp-3">{media.description}</p>
            <button
                onClick={() => setSelectedMedia(media)}
                className="w-full py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green"
            >
                Voir
            </button>
        </>
    );

    const renderModalContent = (media) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold">{media.title}</h2>
        {media.type === 'image' ? ( // Utilisez le champ `type` pour déterminer le contenu
            <img src={media.url} alt={media.title} className="max-w-full h-auto rounded-lg mx-auto" />
        ) : (
            <div className="aspect-w-16 aspect-h-9">
                <iframe
                    className="w-full h-96 rounded-lg"
                    // Correction ici : utilisez getEmbedUrl pour les vidéos
                    src={getEmbedUrl(media.url)} 
                    title={media.title}
                    allowFullScreen
                />
            </div>
        )}
        <p className="text-neutral-700">{media.description}</p>
    </div>
);

    return (
        <ResourceList
            resourceName="mediatheque"
            renderCard={renderCard}
            renderModalContent={renderModalContent}
            formFields={formFields}
            placeholder={defaultCover}
        />
    );
}

function AppsList() {
    const defaultCover = "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Application";
    const formFields = [
        { name: 'name', label: 'Nom', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'platform', label: 'Plateforme', type: 'text', required: true },
        { name: 'downloadUrl', label: "URL de téléchargement", type: 'url', required: true },
        { name: 'iconUrl', label: "URL de l'icône", type: 'url' },
        { name: 'category', label: 'Catégorie', type: 'text' }
    ];

    const renderCard = (app, setSelectedApp) => (
        <>
            <h3 className="font-bold text-xl mb-2">{app.name}</h3>
            <p className="text-neutral-600 mb-4 line-clamp-3">{app.description}</p>
            <a
                href={app.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green text-center"
            >
                Télécharger
            </a>
        </>
    );

    const renderModalContent = (app) => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">{app.name}</h2>
            <p className="text-neutral-700">{app.description}</p>
            <a
                href={app.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green"
            >
                Ouvrir l'application
            </a>
        </div>
    );

    return (
        <ResourceList
            resourceName="apps"
            renderCard={renderCard}
            renderModalContent={renderModalContent}
            formFields={formFields}
            placeholder={defaultCover}
        />
    );
}

function InfoKitsList() {
    const defaultCover = "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Info+Kit";
    const formFields = [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'fileUrl', label: 'URL du fichier', type: 'url', required: true },
        { name: 'imageUrl', label: "URL de l'image", type: 'url' },
        { name: 'language', label: 'Langue', type: 'text' }
    ];

    const renderCard = (kit, setSelectedKit) => (
        <>
            <h3 className="font-bold text-xl mb-2">{kit.title}</h3>
            <p className="text-neutral-600 mb-4 line-clamp-3">{kit.description}</p>
            <a
                href={kit.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green text-center"
            >
                Télécharger
            </a>
        </>
    );

    const renderModalContent = (kit) => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">{kit.title}</h2>
            <p className="text-neutral-700">{kit.description}</p>
            <a
                href={kit.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-brand-brown text-white rounded-md hover:bg-brand-green"
            >
                Télécharger le kit
            </a>
        </div>
    );

    return (
        <ResourceList
            resourceName="info-kits"
            renderCard={renderCard}
            renderModalContent={renderModalContent}
            formFields={formFields}
            placeholder={defaultCover}
        />
    );
}

// Composant principal RessourcesPage
function RessourcesPage() {
    const ressources = [
        { path: 'webinaire', label: 'Webinaires' },
        { path: 'articles', label: 'Articles' },
        { path: 'livre-blanc', label: 'Livres blancs' },
        { path: 'brochures', label: 'Brochures' },
        { path: 'communiques', label: 'Communiqués' },
        { path: 'mediatheque', label: 'Médiathèque' },
        { path: 'apps', label: 'Applications' },
        { path: 'info-kits', label: 'Kits d\'info' }
    ];

    const location = useLocation();

return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: "url('https://res.cloudinary.com/djhyztec8/image/upload/v1755533696/rendu-3d-d-une-conception-d-arriere-plan-pour-les-communications-reseau_l2k5vc.jpg')",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        backgroundBlendMode: "lighten",
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Ressources</h1>

        <nav className="flex flex-wrap justify-center gap-2 mb-8">
          {ressources.map(r => {
            const isActive = location.pathname.endsWith(r.path);
            return (
              <Link
                key={r.path}
                to={r.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-brown text-white'
                    : 'bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {r.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t pt-8">
          <Routes>
            <Route path="webinaire" element={<WebinarList />} />
            <Route path="articles" element={<ArticleList />} />
            <Route path="livre-blanc" element={<LivreBlancList />} />
            <Route path="brochures" element={<BrochuresList />} />
            <Route path="communiques" element={<CommuniquesList />} />
            <Route path="mediatheque" element={<MediathequeList />} />
            <Route path="apps" element={<AppsList />} />
            <Route path="info-kits" element={<InfoKitsList />} />
            <Route
              path="/"
              element={
                <div className="text-center py-12">
                  <p className="text-lg text-neutral-600">
                    Sélectionnez une catégorie pour afficher les ressources
                  </p>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default RessourcesPage;
