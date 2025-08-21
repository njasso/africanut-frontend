import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Composant modal pour afficher les messages
const MessageBox = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
      <p className="text-lg font-semibold">{message}</p>
      <div className="mt-4 flex justify-center">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition"
        >
          OK
        </button>
      </div>
    </div>
  </div>
);

export default function ProductForm({ product, onClose, onSave, categories, setCategories }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryName: '',
    photos: [], // tableau pour plusieurs images
    characteristics: '',
    stock_quantity: '', // AJOUTÉ : État pour la quantité de stock
  });
  const [newCategory, setNewCategory] = useState('');
  const [photoPreviews, setPhotoPreviews] = useState([]); // prévisualisation multiple
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [messageBox, setMessageBox] = useState(null);

  useEffect(() => {
    if (product) {
      const initialCategory = categories.find(
        cat => cat.id === (product.categoryId || product.category?.id)
      );

      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price !== undefined ? product.price.toString() : '',
        categoryName: initialCategory?.name || '',
        photos: product.photos || [],
        characteristics: product.characteristics
          ? JSON.stringify(product.characteristics, null, 2)
          : '',
        stock_quantity: product.stock_quantity !== undefined ? product.stock_quantity.toString() : '', // AJOUTÉ : Mettre à jour le stock si on modifie un produit
      });

      setPhotoPreviews(product.photos || []);
    }
  }, [product, categories]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = e => {
    setNewCategory('');
    setFormData(prev => ({ ...prev, categoryName: e.target.value }));
  };

  const handleNewCategoryChange = e => {
    setFormData(prev => ({ ...prev, categoryName: '' }));
    setNewCategory(e.target.value);
  };

  // --- Upload multi-images ---
  const handleImageUpload = async e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const data = new FormData();
        data.append('file', file);

        const res = await fetch('/api/upload', { method: 'POST', body: data });
        const json = await res.json();
        uploadedUrls.push(json.url);
      }

      // Met à jour le formulaire et les prévisualisations
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...uploadedUrls] }));
      setPhotoPreviews(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error('Upload failed:', err);
      setMessageBox({ message: "Erreur lors de l'upload des images." });
    } finally {
      setIsUploading(false);
    }
  };

  // --- Supprimer une image ---
  const handleRemoveImage = url => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter(p => p !== url) }));
    setPhotoPreviews(prev => prev.filter(p => p !== url));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name || !formData.price || (!formData.categoryName && !newCategory) || formData.stock_quantity === '') {
      setMessageBox({ message: "Nom, prix, quantité en stock et catégorie sont obligatoires." }); // MODIFIÉ : Ajout du stock
      return;
    }

    setIsSaving(true);
    let categoryIdToSave;

    try {
      if (newCategory) {
        const existingCategory = categories.find(
          cat => cat.name.toLowerCase() === newCategory.toLowerCase()
        );
        if (existingCategory) categoryIdToSave = existingCategory.id;
        else {
          const resCat = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newCategory }),
          });
          if (!resCat.ok) {
            const errorData = await resCat.json();
            setMessageBox({
              message: `Erreur création catégorie : ${errorData.error || resCat.statusText}`,
            });
            setIsSaving(false);
            return;
          }
          const savedCat = await resCat.json();
          setCategories([...categories, savedCat]);
          categoryIdToSave = savedCat.id;
        }
      } else {
        const selectedCategory = categories.find(cat => cat.name === formData.categoryName);
        if (selectedCategory) categoryIdToSave = selectedCategory.id;
        else {
          setMessageBox({ message: "Catégorie sélectionnée introuvable." });
          setIsSaving(false);
          return;
        }
      }

      let characteristicsJSON = {};
      if (formData.characteristics) {
        try {
          characteristicsJSON = JSON.parse(formData.characteristics);
        } catch {
          setMessageBox({ message: 'Format des caractéristiques JSON invalide.' });
          setIsSaving(false);
          return;
        }
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price),
        photos: formData.photos.filter(Boolean),
        categoryId: categoryIdToSave,
        characteristics: characteristicsJSON,
        stock_quantity: parseInt(formData.stock_quantity), // AJOUTÉ : Conversion en entier
      };

      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setMessageBox({ message: `Erreur sauvegarde : ${JSON.stringify(errorData.errors || errorData.error)}` });
        setIsSaving(false);
        return;
      }

      const savedProduct = await res.json();
      onSave(savedProduct);
      onClose();
    } catch (err) {
      console.error('Client error:', err);
      setMessageBox({ message: "Erreur lors de la sauvegarde du produit." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {messageBox && <MessageBox message={messageBox.message} onClose={() => setMessageBox(null)} />}
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{product ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Nom du produit"
            value={formData.name}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-green"
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-green"
          />

          <input
            type="number"
            name="price"
            placeholder="Prix (F CFA)"
            value={formData.price}
            onChange={handleChange}
            required
            min={0}
            className="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
          
          {/* AJOUTÉ : Champ pour la quantité en stock */}
          <input
            type="number"
            name="stock_quantity"
            placeholder="Quantité en stock"
            value={formData.stock_quantity}
            onChange={handleChange}
            required
            min={0}
            className="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
          
          <div className="flex space-x-2">
            <select
              name="categoryName"
              value={formData.categoryName}
              onChange={handleCategoryChange}
              className="p-3 border rounded-lg w-1/2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Ou ajouter une nouvelle"
              value={newCategory}
              onChange={handleNewCategoryChange}
              className="p-3 border rounded-lg w-1/2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <label className="block text-sm font-medium text-neutral-700">Images du produit</label>
          <input
            type="file"
            onChange={handleImageUpload}
            multiple
            className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-green file:text-white hover:file:bg-green-700"
          />
          {photoPreviews.length > 0 && (
            <div className="flex flex-wrap mt-2 gap-2">
              {photoPreviews.map(url => (
                <div key={url} className="relative w-20 h-20">
                  <img src={url} alt="Aperçu" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {isUploading && <p className="text-sm text-neutral-500 text-center mt-1">Upload en cours...</p>}

          <div>
            <label className="block text-neutral-700">Caractéristiques (JSON)</label>
            <textarea
              name="characteristics"
              value={formData.characteristics}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-lg"
              rows="6"
              placeholder='Exemple: {"Poids": "15 kg", "Taille": "3 mm"}'
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || isSaving}
            className={`w-full py-3 text-white font-bold rounded-lg transition ${
              isSaving ? 'bg-neutral-400 cursor-not-allowed' : 'bg-brand-green hover:bg-green-700'
            }`}
          >
            {isSaving ? 'Sauvegarde en cours...' : product ? 'Sauvegarder' : 'Ajouter le produit'}
          </button>
        </form>
      </div>
    </div>
  );
}