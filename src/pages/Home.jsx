import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <section 
            className="relative grid md:grid-cols-2 gap-8 items-center min-h-screen"
            style={{
                backgroundImage: 'url(https://res.cloudinary.com/djhyztec8/image/upload/v1755539523/pexels-apasaric-325185_vhyiq1.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Superposition sombre pour assurer la lisibilité du texte */}
            <div className="absolute inset-0 bg-black opacity-10"></div>

            {/* Tout le contenu de votre page est rendu au-dessus de la superposition */}
            <div className="relative z-10 p-4 md:p-16 text-black">
                <div className="flex flex-col justify-center h-full">
                    <div className="space-y-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                            Administration & Gestion du <span className="text-brand-brown">Groupe AFRICANUT</span>
                        </h1>
                        
                        <div className="mt-8">
                            <p className="text-lg text-gray-700">
                                Plateforme pour piloter les entités, le personnel, la comptabilité et les statistiques des activités.
                                Elle incarne la vision de notre entreprise dans la pluralité de ses iniatives qui participent à la resolution des problématiques des secteurs cibles. Nous sommes une entreprise Camerounaise donc le but est de s'étendre dans la Sous-Région et même en Afrique, nous repésentons le : <span className="text-brand-green font-semibold">vert</span>,<span className="text-brand-red font-semibold">rouge</span> et <span className="text-brand-yellow font-semibold">jaune</span>.
                            </p>
                        </div>
                        
                         <div className="mt-8">
                        <h3 className="text-xl font-semibold text-brand-black mb-4">Domaines d'expertise</h3>
                        <div className="flex flex-wrap gap-3">
                            {["Agriculture", "Industrie Animale", "Fôresterie", "Mine", "Management", "Développement numérique"].map((domaine) => (
                            <span
                                key={domaine}
                                className="px-4 py-2 rounded-full bg-brand-gray text-gray text-2x1 font-medium cursor-pointer hover:bg-brand-brown/80 transition"
                            >
                                {domaine}
                            </span>
                            ))}
                        </div>
                        </div>


                        <div className="flex flex-wrap gap-3 mt-6">
                            <Link to="/entreprises" className="px-4 py-3 rounded-2xl bg-brand-brown text-white shadow-soft">Nos entreprises</Link>
                            <Link to="/tableau-de-bord" className="px-4 py-3 rounded-2xl border">Tableau de bord</Link>
                        </div>
                    </div>

                    <div className="mt-28">
                        <div className="flex flex-col items-center">
                            <h2 className="text-3xl font-bold mb-6 text-center">Les Fondateurs</h2>
                            
                            <div className="flex flex-col md:flex-row gap-20 justify-center mb-10">
                                <div className="flex flex-col items-center text-center">
                                    <img src="/images/photo-fondateur1.jpg" alt="Photo d'ESSOLA ONJA'A FELIX MAGLOIRE" className="w-28 h-28 rounded-full object-cover shadow-lg" />
                                    <h3 className="mt-4 text-xl font-semibold">ESSOLA ONJA'A FELIX MAGLOIRE</h3>
                                    <p className="text-neutral">Co-Fondateur</p>
                                    <p className="text-neutral">Ingénieur Halieute</p>
                                </div>

                                <div className="flex flex-col items-center text-center">
                                    <img src="/images/photo-fondateur2.png" alt="Photo de MBAMBA AUGUSTIN GUERIN" className="w-28 h-28 rounded-full object-cover shadow-lg" />
                                    <h3 className="mt-4 text-xl font-semibold">MBAMBA AUGUSTIN GUERIN</h3>
                                    <p className="text-neutral">Co-Fondateur</p>
                                    <p className="text-neutral">Ingénieur des Eaux et Forêts</p>
                                </div>
                            </div>

                            <div className="text-center">
                                <h2 className="text-3xl font-bold mb-6 text-center">Le PDG</h2>
                                <div className="flex flex-col items-center">
                                    <img src="/images/photo-pdg.jpg" alt="Photo d'ESSE DOUALA" className="w-28 h-28 rounded-full object-cover shadow-lg" />
                                    <h3 className="mt-4 text-xl font-semibold">ESSE DOUALA</h3>
                                    <p className="text-neutral">PDG</p>
                                    <p className="text-neutral">ÉCONOMISTE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* L'image sur le côté droit est également au-dessus de l'overlay */}
            <div className="relative z-10 glass rounded-2xl p-6 md:p-8">
                <img src="/logo.jpg" className="rounded-xl w-full object-cover" alt="Logo AFRICANUT" />
                <div className="px-0 py-4 mt-4 text-x1 rounded-2xl bg-brand-brown text-white-600 text-center">
                     Bienvenue 
                </div>
            </div>
        </section>
    );
}
