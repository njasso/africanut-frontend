import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit } from 'lucide-react';

const companies = [
  { slug: "africanut-fish-market", name: "AFRICANUT FISH MARKET" },
  { slug: "magaton-provender", name: "MAGATON PROVENDER" },
  { slug: "nouvelle-academie-numerique-africaine", name: "NOUVELLE ACADEMIE NUMERIQUE AFRICAINE" },
  { slug: "africanut-media", name: "AFRICANUT MEDIA" },
  { slug: "gic-ocenaut", name: "GIC OCENAUT" }
];

const AUTH_TOKEN_KEY = 'token';
const API_BASE = 'https://africanut-backend-production.up.railway.app';

// Helper fetch sécurisé
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) throw new Error("Aucun token trouvé. Veuillez vous connecter.");
  const headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || `Erreur API. Statut: ${response.status}`);
  }
  return response.json();
};

export default function HR() {
  const CLOUDINARY_CLOUD_NAME = 'djhyztec8';
  const CLOUDINARY_UPLOAD_PRESET = 'africanut';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Charger les employés
  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth('/api/employees');
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem(AUTH_TOKEN_KEY)) loadEmployees();
    else setError("Connectez-vous pour accéder aux employés.");
  }, [loadEmployees]);

  const resetForm = () => setForm({
    name: '', role: '', companySlug: '', date_of_birth: '', email: '',
    nationality: '', contract_type: '', phone: '', address: '', salary: '', photo_url: ''
  });

  // Ajouter ou mettre à jour un employé
  const addOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.role || !form.companySlug) { setError('Champs obligatoires manquants.'); return; }
    setIsLoading(true); setError(null);

    const payload = { ...form, salary: form.salary ? Number(form.salary) : null };

    try {
      if (editMode && currentEmployeeId) {
        await fetchWithAuth(`/api/employees/${currentEmployeeId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
      } else {
        await fetchWithAuth('/api/employees', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
      }
      await loadEmployees();
      resetForm();
      setEditMode(false);
      setCurrentEmployeeId(null);
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  // Supprimer un employé
  const remove = (employee) => { setEmployeeToDelete(employee); setShowDeleteModal(true); };
  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsLoading(true); setError(null);
    try {
      await fetchWithAuth(`/api/employees/${employeeToDelete.id}`, { method: 'DELETE' });
      await loadEmployees();
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };
  const cancelDelete = () => { setShowDeleteModal(false); setEmployeeToDelete(null); };

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
      salary: employee.salary || '',
      photo_url: employee.photo_url || ''
    });
  };

  // Upload photo Cloudinary
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) { setError("Aucun fichier sélectionné."); return; }
    if (!["image/jpeg","image/png"].includes(file.type)) { setError("Format non supporté."); return; }
    if (file.size > 5*1024*1024) { setError("Image trop volumineuse (>5MB)."); return; }

    setIsUploading(true); setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method:'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Erreur upload image.");
      setForm(prev => ({ ...prev, photo_url: data.secure_url }));
    } catch(err) { setError(err.message); }
    finally { setIsUploading(false); }
  };

  const filteredEmployees = employees.filter(e =>
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="grid md:grid-cols-[340px,1fr] gap-6">
        {/* Formulaire */}
        <form onSubmit={addOrUpdate} className="bg-white rounded-2xl p-5 shadow-lg space-y-3">
          <h2 className="text-xl font-semibold text-center mb-4">{editMode ? "Modifier un employé" : "Ajouter un employé"}</h2>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="flex flex-col items-center">
            <label htmlFor="photo-upload" className="cursor-pointer">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2">
                {form.photo_url ? <img src={form.photo_url} alt="Employé" className="w-full h-full object-cover"/> : <span className="text-4xl text-gray-400">+</span>}
              </div>
              <input id="photo-upload" type="file" className="hidden" onChange={handlePhotoUpload}/>
            </label>
            {isUploading && <p className="text-xs text-neutral-500 mt-1">Téléchargement...</p>}
          </div>

          <input placeholder="Nom complet" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded-xl px-3 py-2" required/>
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded-xl px-3 py-2"/>
          <input placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded-xl px-3 py-2"/>
          <input placeholder="Poste" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border rounded-xl px-3 py-2" required/>
          
          <select value={form.companySlug} onChange={e => setForm({...form, companySlug: e.target.value})} className="w-full border rounded-xl px-3 py-2" required>
            <option value="">-- Entité --</option>
            {companies.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>

          <input type="date" placeholder="Date de naissance" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="w-full border rounded-xl px-3 py-2"/>
          <input placeholder="Nationalité" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} className="w-full border rounded-xl px-3 py-2"/>
          <input placeholder="Adresse" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border rounded-xl px-3 py-2"/>
          <input type="number" placeholder="Salaire" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} className="w-full border rounded-xl px-3 py-2"/>
          <select value={form.contract_type} onChange={e => setForm({...form, contract_type: e.target.value})} className="w-full border rounded-xl px-3 py-2">
            <option value="">-- Type de contrat --</option>
            <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="Stagiaire">Stagiaire</option>
          </select>

          <div className="flex justify-end gap-2 pt-4">
            {editMode && <button type="button" className="px-4 py-2 rounded-xl bg-gray-300 text-gray-700" onClick={()=>{setEditMode(false);setCurrentEmployeeId(null);resetForm();}}>Annuler</button>}
            <button type="submit" className="px-4 py-2 rounded-xl bg-gray-900 text-white" disabled={isLoading}>{isLoading ? "Chargement..." : (editMode ? "Mettre à jour" : "Ajouter")}</button>
          </div>
        </form>

        {/* Liste employés */}
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-lg">
            <h3 className="font-semibold text-xl">Effectifs ({filteredEmployees.length})</h3>
            <input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="px-3 py-2 border rounded-xl w-60"/>
          </div>

          {isLoading && <p className="text-center text-neutral-500 mt-4">Chargement des données...</p>}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(e => {
              const company = companies.find(c => c.slug === e.company?.slug);
              return (
                <div key={e.id} className="bg-white rounded-2xl p-5 shadow-lg relative">
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button onClick={() => startEdit(e)}><Edit size={18} className="text-gray-500 hover:text-gray-700"/></button>
                    <button onClick={() => remove(e)}><Trash2 size={18} className="text-red-500 hover:text-red-700"/></button>
                  </div>
                  <div className="text-center mb-4">
                    {e.photo_url && <img src={e.photo_url} alt={e.name} className="mb-2 rounded-full w-20 h-20 object-cover mx-auto"/>}
                    <div className="font-bold text-lg">{e.name || 'N/A'}</div>
                    <div className="text-sm text-neutral-600">{e.role || 'N/A'}</div>
                    <div className="text-x1 text-gray-500 italic mt-1">{company?.name || 'Entité non définie'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modale suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <p className="mb-4">Supprimer {employeeToDelete?.name} ? Cette action est irréversible.</p>
            <div className="flex justify-center gap-4">
              <button className="px-4 py-2 bg-gray-300 rounded-xl" onClick={cancelDelete}>Annuler</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-xl" onClick={confirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
