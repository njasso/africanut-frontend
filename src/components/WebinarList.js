import { useState, useEffect } from 'react';

export default function WebinarList() {
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWebinar, setSelectedWebinar] = useState(null);

  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5005/api/webinars');

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        setWebinars(data);
        setError(null);
      } catch (e) {
        console.error("Échec de la récupération des webinaires:", e);
        setError("Impossible de charger les webinaires. Vérifiez le serveur.");
        setWebinars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWebinars();
  }, []);

  if (error) {
    return <div className="text-center p-8 text-red-500">Erreur: {error}</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6 text-neutral-800 text-center">Webinaires Disponibles</h1>
      <p className="text-neutral-700 text-center mb-6">
        Retrouvez nos webinaires sur différents sujets liés à AFRICANUT INDUSTRY.
      </p>

      {loading ? (
        <p className="text-center text-neutral-500">Chargement...</p>
      ) : webinars.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-neutral-600 text-lg">Aucun webinaire disponible.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {webinars.map(webinar => (
            <div
              key={webinar.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <img
                src={webinar.coverImageUrl || "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Webinar"}
                alt={webinar.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-xl text-neutral-800 mb-2">{webinar.title}</h3>
                <p className="text-neutral-600 mb-4 line-clamp-3">{webinar.description}</p>
                <button
                  onClick={() => setSelectedWebinar(webinar)}
                  className="w-full py-2 px-4 bg-brand-brown text-white rounded-lg font-medium hover:bg-brand-green"
                >
                  Regarder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour visionnage */}
      {selectedWebinar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          onClick={() => setSelectedWebinar(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl w-full mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedWebinar.coverImageUrl || "https://placehold.co/600x400/E5E7EB/9CA3AF?text=Webinar"}
              alt={selectedWebinar.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedWebinar.title}</h2>
              <div className="relative" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={selectedWebinar.videoUrl}
                  title={selectedWebinar.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                ></iframe>
              </div>
              <p className="text-neutral-600 mt-4">{selectedWebinar.description}</p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedWebinar(null)}
                  className="py-2 px-6 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
