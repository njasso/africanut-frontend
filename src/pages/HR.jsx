import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, Edit, ChevronUp, ChevronDown } from 'lucide-react';

/** ---- Entreprises (affichage) ---- */
const companies = [
  { slug: "africanut-fish-market", name: "AFRICANUT FISH MARKET" },
  { slug: "magaton-provender", name: "MAGATON PROVENDER" },
  { slug: "nouvelle-academie-numerique-africaine", name: "NOUVELLE ACADEMIE NUMERIQUE AFRICAINE" },
  { slug: "africanut-media", name: "AFRICANUT MEDIA" },
  { slug: "gic-ocenaut", name: "GIC OCENAUT" }
];

/** ---- Configuration d'API commune ---- */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://africanut-backend-postgres.onrender.com';
const AUTH_TOKEN_KEY = 'token';

// Configuration axios commune
import axios from 'axios';

const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setToken = (t) => localStorage.setItem(AUTH_TOKEN_KEY, t);

// Client API configuré
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fonction API générique (compatibilité avec fetch)
const api = async (path, options = {}) => {
  const headers = options.headers || {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE_URL + path, { ...options, headers });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Erreur API: ${res.status}`);
  }

  return res.headers.get('content-type')?.includes('application/json')
    ? res.json()
    : res.text();
};

export default function HR() {
  /** ---- Cloudinary ---- */
  const CLOUDINARY_CLOUD_NAME = 'djhyztec8';
  const CLOUDINARY_UPLOAD_PRESET = 'africanut';

  /** ---- States ---- */
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: '', role: '', companySlug: '', date_of_birth: '', email: '',
    nationality: '', contract_type: '', phone: '', address: '', salary: '', photo_url: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [corsHint, setCorsHint] = useState(false);

  // Modale suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Tri + pagination
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  /** ---- Load employees via apiClient ---- */
  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCorsHint(false);
    try {
      // Utiliser apiClient au lieu de fetchWithAuth
      const response = await apiClient.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error("Erreur récupération employés:", err);
      let errorMessage = err.message;
      
      // Extraire le message d'erreur de la réponse axios
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);

      // Indice classique d'un blocage CORS
      if (err.message.includes('Network Error') || err.message.includes('CORS')) {
        setCorsHint(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) {
      loadEmployees();
    } else {
      setError("Connectez-vous pour accéder aux employés.");
    }
  }, [loadEmployees]);

  /** ---- Utils ---- */
  const resetForm = () => setForm({
    name: '', role: '', companySlug: '', date_of_birth: '', email: '',
    nationality: '', contract_type: '', phone: '', address: '', salary: '', photo_url: ''
  });

  const money = (val) =>
    (val || val === 0) ? Number(val).toLocaleString('fr-FR') + ' F CFA' : 'N/A';

  /** ---- Create / Update via apiClient ---- */
  const addOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.role || !form.companySlug) {
      setError('Champs obligatoires manquants (Nom, Poste, Entité).');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      ...form,
      salary: form.salary !== '' ? Number(form.salary) : null
    };

    try {
      if (editMode && currentEmployeeId) {
        // Mise à jour avec apiClient
        await apiClient.put(`/api/employees/${currentEmployeeId}`, payload);
      } else {
        // Création avec apiClient
        await apiClient.post('/api/employees', payload);
      }
      await loadEmployees();
      resetForm();
      setEditMode(false);
      setCurrentEmployeeId(null);
    } catch (err) {
      let errorMessage = err.message;
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /** ---- Delete via apiClient ---- */
  const remove = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/employees/${employeeToDelete.id}`);
      await loadEmployees();
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (err) {
      let errorMessage = err.message;
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  /** ---- Edit ---- */
  const startEdit = (employee) => {
    setEditMode(true);
    setCurrentEmployeeId(employee.id);
    setForm({
      name: employee.name || '',
      role: employee.role || '',
      companySlug: employee.company?.slug || '',
      date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
      email: employee.email || '',
      nationality: employee.nationality || '',
      contract_type: employee.contract_type || '',
      phone: employee.phone || '',
      address: employee.address || '',
      salary: employee.salary ?? '',
      photo_url: employee.photo_url || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** ---- Upload photo (Cloudinary) ---- */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) { setError("Aucun fichier sélectionné."); return; }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Format non supporté. Utilisez JPG ou PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop volumineuse (> 5 Mo).");
      return;
    }

    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Erreur upload image.");
      setForm(prev => ({ ...prev, photo_url: data.secure_url }));
    } catch (err) {
      setError(`Upload échoué: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  /** ---- Recherche globale ---- */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter(e => {
      const fields = [
        e.name, e.role, e.email, e.phone, e.address, e.nationality,
        e.contract_type, e?.company?.name, e?.company?.slug
      ];
      const salaryStr = e.salary != null ? String(e.salary) : '';
      const dob = e.date_of_birth ? e.date_of_birth.split('T')[0] : '';
      return [...fields, salaryStr, dob].some(v =>
        (v || '').toString().toLowerCase().includes(q)
      );
    });
  }, [employees, searchQuery]);

  /** ---- Tri ---- */
  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
    setCurrentPage(1);
  };

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const getVal = (x) => {
        if (sortField === 'company') return x.company?.name || '';
        if (sortField === 'salary') return x.salary ?? -Infinity;
        if (sortField === 'date_of_birth') return x.date_of_birth || '';
        return (x[sortField] ?? '').toString().toLowerCase();
      };
      let va = getVal(a);
      let vb = getVal(b);

      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();

      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortField, sortOrder]);

  /** ---- Pagination ---- */
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageItems = sorted.slice(pageStart, pageStart + itemsPerPage);

  const SortBtn = ({ field, label }) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className={`px-3 py-1 rounded-lg border text-sm flex items-center gap-1
        ${sortField === field ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
      title={`Trier par ${label}`}
    >
      <span>{label}</span>
      {sortField === field ? (sortOrder === 'asc' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>) : null}
    </button>
  );

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Alerte CORS si besoin */}
        {corsHint && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800">
            Le navigateur a bloqué la requête (CORS). Assure-toi que le backend envoie bien
            <code className="px-1 mx-1 bg-yellow-100 rounded">Access-Control-Allow-Origin: {window.location.origin}</code>
            et
            <code className="px-1 mx-1 bg-yellow-100 rounded">Access-Control-Allow-Headers: Authorization, Content-Type</code>
            sur <span className="font-semibold">toutes</span> les routes <span className="font-mono">/api/*</span>.
          </div>
        )}

        <div className="grid md:grid-cols-[360px,1fr] gap-6">
          {/* --- Formulaire --- */}
          <form onSubmit={addOrUpdate} className="bg-white rounded-2xl p-5 shadow-lg space-y-3">
            <h2 className="text-xl font-semibold text-center mb-2">
              {editMode ? "Modifier un employé" : "Ajouter un employé"}
            </h2>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <div className="flex flex-col items-center">
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2">
                  {form.photo_url
                    ? <img src={form.photo_url} alt="Employé" className="w-full h-full object-cover"/>
                    : <span className="text-4xl text-gray-400">+</span>
                  }
                </div>
                <input id="photo-upload" type="file" className="hidden" onChange={handlePhotoUpload}/>
              </label>
              {isUploading && <p className="text-xs text-neutral-500 mt-1">Téléchargement...</p>}
            </div>

            <input
              placeholder="Nom complet"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
            <input
              placeholder="Téléphone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
            <input
              placeholder="Poste"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
              required
            />

            <select
              value={form.companySlug}
              onChange={e => setForm({ ...form, companySlug: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
              required
            >
              <option value="">-- Entité --</option>
              {companies.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>

            <input
              type="date"
              placeholder="Date de naissance"
              value={form.date_of_birth}
              onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
            <input
              placeholder="Nationalité"
              value={form.nationality}
              onChange={e => setForm({ ...form, nationality: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
            <input
              placeholder="Adresse"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
            <input
              type="number"
              placeholder="Salaire"
              value={form.salary}
              onChange={e => setForm({ ...form, salary: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
            <select
              value={form.contract_type}
              onChange={e => setForm({ ...form, contract_type: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            >
              <option value="">-- Type de contrat --</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stagiaire">Stagiaire</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              {editMode && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-gray-300 text-gray-700 hover:bg-gray-400"
                  onClick={() => { setEditMode(false); setCurrentEmployeeId(null); resetForm(); }}
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? "Chargement..." : (editMode ? "Mettre à jour" : "Ajouter")}
              </button>
            </div>
          </form>

          {/* --- Liste + outils --- */}
          <div className="space-y-3">
            {/* Barre outils */}
            <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xl">
                  Effectifs ({filtered.length})
                </h3>
                {isLoading && <span className="text-sm text-neutral-500">• chargement…</span>}
              </div>

              <div className="flex flex-wrap gap-2">
                <SortBtn field="name" label="Nom" />
                <SortBtn field="role" label="Poste" />
                <SortBtn field="company" label="Entité" />
                <SortBtn field="salary" label="Salaire" />
                <SortBtn field="date_of_birth" label="Naissance" />
              </div>

              <div className="flex items-center gap-3">
                <input
                  placeholder="Rechercher (nom, poste, email...)"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 border rounded-xl w-64"
                />
                <select
                  className="px-3 py-2 border rounded-xl"
                  value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  {[6, 9, 12, 24].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
              </div>
            </div>

            {/* Cartes employés */}
            {pageItems.length === 0 && !isLoading && (
              <div className="bg-white rounded-xl p-6 text-center text-neutral-600 shadow">
                Aucun résultat.
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageItems.map(e => {
                const company = companies.find(c => c.slug === e.company?.slug);
                return (
                  <div key={e.id} className="bg-white rounded-2xl p-5 shadow-lg relative">
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button onClick={() => startEdit(e)} title="Modifier">
                        <Edit size={18} className="text-gray-500 hover:text-gray-700" />
                      </button>
                      <button onClick={() => remove(e)} title="Supprimer">
                        <Trash2 size={18} className="text-red-500 hover:text-red-700" />
                      </button>
                    </div>

                    <div className="text-center mb-4">
                      {e.photo_url && (
                        <img
                          src={e.photo_url}
                          alt={e.name}
                          className="mb-2 rounded-full w-20 h-20 object-cover mx-auto"
                        />
                      )}
                      <div className="font-bold text-lg">{e.name || 'N/A'}</div>
                      <div className="text-sm text-neutral-600">{e.role || 'N/A'}</div>
                      <div className="text-sm text-gray-500 italic mt-1">
                        {company?.name || e.company?.name || 'Entité non définie'}
                      </div>
                    </div>

                    <hr className="my-2 border-neutral-200" />

                    <div className="text-sm text-neutral-600 space-y-1">
                      <p>📧 <span className="text-gray-800">{e.email || 'N/A'}</span></p>
                      <p>📞 <span className="text-gray-800">{e.phone || 'N/A'}</span></p>
                      <p>🏠 <span className="text-gray-800">{e.address || 'N/A'}</span></p>
                      <p>🎂 <span className="text-gray-800">{e.date_of_birth ? e.date_of_birth.split('T')[0] : 'N/A'}</span></p>
                      <p>🌍 <span className="text-gray-800">{e.nationality || 'N/A'}</span></p>
                      <p>📜 <span className="text-gray-800">{e.contract_type || 'N/A'}</span></p>
                      <p>💰 <span className="text-gray-800">{money(e.salary)}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow">
              <div className="text-sm text-neutral-600">
                Page {currentPage}/{totalPages} — {sorted.length} résultat(s)
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded-lg border disabled:opacity-50"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Précédent
                </button>
                <button
                  className="px-3 py-1 rounded-lg border disabled:opacity-50"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modale de confirmation de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <h3 className="text-lg font-bold mb-3">Confirmer la suppression</h3>
              <p className="text-sm text-gray-700 mb-6">
                Supprimer <span className="font-semibold">{employeeToDelete?.name}</span> ?
                Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 bg-gray-200 rounded-xl" onClick={cancelDelete}>Annuler</button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-xl" onClick={confirmDelete}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
