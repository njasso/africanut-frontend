import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Minus, Plus, FileText } from 'lucide-react';
import axios from 'axios';
import ProductForm from '../components/ProductForm.jsx';

// ✅ Fixed Interceptors Axios pour inclure le token et gérer 401
axios.interceptors.request.use(config => {
  // Check multiple possible token storage locations
  const token = localStorage.getItem('authToken') || 
                localStorage.getItem('token') || 
                sessionStorage.getItem('authToken') || 
                sessionStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No authentication token found');
    // Optional: redirect to login if no token found
    // window.location.href = '/login';
  }
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      alert('Session expirée. Veuillez vous reconnecter.');
      // Clear any existing tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Composant pour afficher des messages modaux
const MessageBox = ({ message, onConfirm, onCancel, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl text-center w-80">
      <p className="text-lg font-semibold">{message}</p>
      <div className="mt-4 flex justify-center gap-4">
        {onConfirm && <button onClick={onConfirm} className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition">Oui</button>}
        {onCancel && <button onClick={onCancel} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition">Non</button>}
        {!onConfirm && !onCancel && <button onClick={onClose} className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition">OK</button>}
      </div>
    </div>
  </div>
);

// Modal rapport de stock
const ReportModal = ({ onClose, report }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
      <h2 className="text-2xl font-bold mb-4">Rapport de Stock</h2>
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
      {report.length === 0 ? (
        <p className="text-neutral-500">Aucun mouvement de stock pour la période sélectionnée.</p>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {report.map(movement => (
            <li key={movement.id} className={`p-2 rounded-lg ${movement.type === 'entry' ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className="font-semibold">{movement.product.name}</span> :
              <span className={`ml-2 font-bold ${movement.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                {movement.type === 'entry' ? 'Entrée' : 'Sortie'} de {movement.quantity}
              </span>
              <p className="text-sm text-neutral-500 mt-1">
                Le {new Date(movement.movementDate).toLocaleDateString()} à {new Date(movement.movementDate).toLocaleTimeString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [messageBox, setMessageBox] = useState(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [stockReport, setStockReport] = useState([]);
  const [reportStart, setReportStart] = useState(new Date().toISOString().slice(0,10));
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().slice(0,10));

  // 📦 Charger produits et catégories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/products')
        ]);
        setCategories(catRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.error('Erreur chargement données:', err);
        setMessageBox({ message: 'Erreur lors du chargement des données.', type: 'info' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 💾 Sauvegarde produit
  const handleSaveProduct = async (product) => {
    try {
      if (product.id) {
        const res = await axios.put(`/api/products/${product.id}`, product);
        setProducts(products.map(p => p.id === product.id ? res.data : p));
        setMessageBox({ message: 'Produit mis à jour avec succès.', type: 'info' });
      } else {
        const res = await axios.post('/api/products', product);
        setProducts([...products, res.data]);
        setMessageBox({ message: 'Produit ajouté avec succès.', type: 'info' });
      }
    } catch (err) {
      console.error(err);
      setMessageBox({ message: 'Erreur lors de la sauvegarde.', type: 'info' });
    }
    setIsFormVisible(false);
    setCurrentProduct(null);
  };

  // 🔄 Mise à jour stock
  const handleUpdateStock = async (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const diff = newQuantity - product.stock_quantity;
    if (diff === 0) return;

    try {
      const type = diff > 0 ? 'entry' : 'exit';
      const quantity = Math.abs(diff);
      await axios.post(`/api/products/${productId}/stock/movements`, { type, quantity });
      // Rafraîchir le produit depuis backend
      const updatedProduct = (await axios.get(`/api/products/${productId}`)).data;
      setProducts(products.map(p => p.id === productId ? updatedProduct : p));
    } catch (err) {
      console.error('Erreur mise à jour stock:', err);
      setMessageBox({ message: 'Erreur lors de la mise à jour du stock.', type: 'info' });
    }
  };

  // 📊 Générer rapport
  const handleGenerateReport = async () => {
    try {
      const res = await axios.get('/api/reports/stock', {
        params: { startDate: reportStart, endDate: reportEnd }
      });
      setStockReport(res.data);
      setIsReportModalVisible(true);
    } catch (err) {
      console.error('Erreur génération rapport:', err);
      setMessageBox({ message: 'Erreur lors de la génération du rapport.', type: 'info' });
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setIsFormVisible(true);
  };

  const handleDelete = (productId) => {
    setMessageBox({
      message: 'Êtes-vous sûr de vouloir supprimer ce produit ?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/products/${productId}`);
          setProducts(products.filter(p => p.id !== productId));
          setMessageBox({ message: 'Produit supprimé avec succès.', type: 'info' });
        } catch (err) {
          console.error(err);
          setMessageBox({ message: 'Erreur lors de la suppression.', type: 'info' });
        }
      },
      onCancel: () => setMessageBox(null)
    });
  };

  return (
    <div className="p-4 md:p-8">
      {/* Modales */}
      {messageBox && (
        <MessageBox
          message={messageBox.message}
          onClose={messageBox.type === 'info' ? () => setMessageBox(null) : null}
          onConfirm={messageBox.type === 'confirm' ? messageBox.onConfirm : null}
          onCancel={messageBox.type === 'confirm' ? messageBox.onCancel : null}
        />
      )}

      {isReportModalVisible && <ReportModal onClose={() => setIsReportModalVisible(false)} report={stockReport} />}

      {/* Titre et actions */}
      <h1 className="text-4xl font-extrabold text-brand-brown mb-6">Gestion des produits</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button onClick={() => { setIsFormVisible(true); setCurrentProduct(null); }}
          className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          <PlusCircle size={20} /> Ajouter un nouveau produit
        </button>

        <div className="flex items-center gap-2">
          <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)}
            className="border rounded-md p-2" />
          <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)}
            className="border rounded-md p-2" />
          <button onClick={handleGenerateReport} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <FileText size={20} /> Générer Rapport
          </button>
        </div>
      </div>

      {/* Liste des produits */}
      {isLoading ? (
        <div className="p-8 text-center text-neutral-500 text-xl font-semibold">
          Chargement des produits...
          <div className="mt-4 animate-pulse h-12 w-full bg-gray-200 rounded-lg"></div>
          <div className="mt-2 animate-pulse h-12 w-full bg-gray-200 rounded-lg"></div>
        </div>
      ) : (
        products.length === 0 ? (
          <div className="text-center text-neutral-500">Aucun produit ajouté pour le moment.</div>
        ) : (
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-center bg-white shadow-sm">
                <div className="flex items-start gap-4 flex-1">
                  {product.photos?.[0] && <img src={product.photos[0]} alt={product.name} className="max-w-[64px] max-h-[64px] object-contain rounded-md" />}
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">{product.name}</h2>
                    <p className="text-sm text-neutral-500 mt-1">Catégorie: {product.category?.name || product.category}</p>
                    <p className="mt-2 text-neutral-700 italic text-sm">{product.description}</p>
                    <p className="mt-1 font-bold text-brand-brown">{product.price.toLocaleString()} F CFA</p>
                    {product.characteristics && typeof product.characteristics === 'object' && (
                      <div className="mt-2 pt-2 border-t border-gray-200 w-full text-left">
                        <h4 className="font-semibold text-sm">Caractéristiques</h4>
                        <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                          {Object.entries(product.characteristics).map(([key, value]) => (
                            <li key={key}><span className="font-medium">{key}:</span> {value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex flex-col items-end md:items-center">
                  <span className="font-bold text-lg mb-2">Stock: {product.stock_quantity}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpdateStock(product.id, product.stock_quantity - 1)} className="p-1 bg-gray-200 rounded-full hover:bg-gray-300 transition disabled:opacity-50" disabled={product.stock_quantity <= 0}><Minus size={16} /></button>
                    <button onClick={() => handleUpdateStock(product.id, product.stock_quantity + 1)} className="p-1 bg-gray-200 rounded-full hover:bg-gray-300 transition"><Plus size={16} /></button>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700 flex items-center gap-1"><Edit size={16} /> Modifier</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={16} /> Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {isFormVisible && <ProductForm product={currentProduct} onClose={() => setIsFormVisible(false)} onSave={handleSaveProduct} categories={categories} setCategories={setCategories} />}
    </div>
  );
}
