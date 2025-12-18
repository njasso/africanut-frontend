import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ShoppingCart, Trash2, Search, ChevronDown, X, ChevronLeft, ChevronRight, Plus, Minus, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// Configuration d'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://africanut-backend-postgres.onrender.com';
const companyId = '4809480a-c8cb-4990-afd7-e9337993825e';

// Fonctions pour gérer le token JWT
const getToken = () => localStorage.getItem('token');
const setToken = (t) => localStorage.setItem('token', t);

// Configuration axios
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

// Fonction API générique
export async function api(path, options = {}) {
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
}

// Composant pour afficher des messages modaux
const MessageBox = ({ message, onClose, type = 'info' }) => {
  const getIcon = () => {
    switch(type) {
      case 'warning': return <AlertTriangle size={24} className="text-yellow-500" aria-hidden="true" />;
      case 'error': return <AlertTriangle size={24} className="text-red-500" aria-hidden="true" />;
      default: return null;
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white p-6 rounded-lg text-center max-w-md w-full">
        <div className="flex justify-center mb-2">
          {getIcon()}
        </div>
        <h2 id="modal-title" className="text-lg font-semibold mb-2">{message}</h2>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
          autoFocus
        >
          OK
        </button>
      </div>
    </div>
  );
};

// Composant Skeleton pour le chargement
const ProductSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center text-center animate-pulse" aria-label="Chargement du produit">
    <div className="w-40 h-40 bg-gray-300 rounded-xl mb-4"></div>
    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-5/6 mb-4"></div>
    <div className="h-6 bg-gray-300 rounded w-1/3"></div>
  </div>
);

// Composant pour la prévisualisation du produit
const ProductPreview = ({ product, onClose, onAddToCart }) => {
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleImageNavigation = (direction) => {
    if (direction === 'next') {
      setCurrentImageIndex(prev => 
        prev < product.photos.length - 1 ? prev + 1 : 0
      );
    } else {
      setCurrentImageIndex(prev => 
        prev > 0 ? prev - 1 : product.photos.length - 1
      );
    }
  };

  if (product.stock_quantity <= 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" aria-hidden="true" />
        <h3 className="text-xl font-bold text-red-600 mb-2">Produit en rupture de stock</h3>
        <p className="text-neutral-600">Ce produit n'est actuellement pas disponible.</p>
      </div>
    );
  }

  return (
    <>
      <h3 className="text-xl font-bold mb-4 text-brand-brown">{product.name}</h3>

      {product.photos?.length > 0 && (
        <div className="relative mb-4">
          <button
            onClick={() => handleImageNavigation('prev')}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full hover:bg-gray-100 z-10 focus:outline-none focus:ring-2 focus:ring-brand-green"
            aria-label="Image précédente"
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>
          
          <div className="flex justify-center">
            <img
              src={product.photos[currentImageIndex]}
              alt={`${product.name} ${currentImageIndex + 1}`}
              className="w-64 sm:w-72 md:w-80 h-64 object-contain rounded-lg"
              loading="lazy"
            />
          </div>
          
          {product.photos.length > 1 && (
            <div className="flex justify-center mt-2 space-x-2">
              {product.photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full ${currentImageIndex === index ? 'bg-brand-green' : 'bg-gray-300'}`}
                  aria-label={`Afficher l'image ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          <button
            onClick={() => handleImageNavigation('next')}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full hover:bg-gray-100 z-10 focus:outline-none focus:ring-2 focus:ring-brand-green"
            aria-label="Image suivante"
          >
            <ChevronRight size={24} aria-hidden="true" />
          </button>
        </div>
      )}

      <p className="text-neutral-700 mb-2">{product.description}</p>
      {product.characteristics && (
        <ul className="list-disc list-inside text-sm text-neutral-600 mb-4">
          {Object.entries(product.characteristics).map(([key, value]) => (
            <li key={key}><span className="font-medium">{key}:</span> {value}</li>
          ))}
        </ul>
      )}

      <div className="flex justify-between items-center mb-4">
        <p className="font-bold text-xl text-brand-green">
          {product.price.toLocaleString()} F CFA
        </p>
        <p className={`text-sm font-medium ${
          product.stock_quantity <= 5 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {product.stock_quantity} en stock
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 my-4">
        <button
          onClick={() => setQuantityToAdd(q => Math.max(1, q - 1))}
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-brand-green"
          aria-label="Réduire la quantité"
        >
          <Minus size={20} aria-hidden="true" />
        </button>
        <span className="text-xl font-bold" aria-live="polite">{quantityToAdd}</span>
        <button
          onClick={() => {
            if (quantityToAdd < product.stock_quantity) {
              setQuantityToAdd(q => q + 1);
            }
          }}
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-brand-green"
          aria-label="Augmenter la quantité"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>

      <button
        onClick={() => {
          onAddToCart(product, quantityToAdd);
          onClose();
        }}
        className="mt-4 w-full py-2 bg-brand-green text-white rounded-lg font-semibold hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
      >
        Ajouter au panier ({quantityToAdd})
      </button>
    </>
  );
};

export default function Store() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [messageBox, setMessageBox] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Utiliser useMemo pour les produits filtrés
  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory !== 'all') {
      result = result.filter(product => (product.category?.name || product.category) === selectedCategory);
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(lower) ||
        (product.description && product.description.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [products, searchQuery, selectedCategory]);

  // Charger les produits et le panier via l'API
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        // Utiliser apiClient (avec intercepteur de token) au lieu d'axios directement
        const [productsRes, savedCart, savedCustomerInfo] = await Promise.allSettled([
          apiClient.get('/api/products', { signal }),
          localStorage.getItem('cart'),
          localStorage.getItem('customerInfo')
        ]);

        if (productsRes.status === 'fulfilled') {
          const fetchedProducts = productsRes.value.data;
          setProducts(fetchedProducts);
          const uniqueCategories = [...new Set(fetchedProducts.map(p => p.category?.name || p.category))];
          setCategories(uniqueCategories);
        }

        if (savedCart.status === 'fulfilled' && savedCart.value) {
          setCart(JSON.parse(savedCart.value));
        }

        if (savedCustomerInfo.status === 'fulfilled' && savedCustomerInfo.value) {
          setCustomerInfo(JSON.parse(savedCustomerInfo.value));
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Erreur lors du chargement des produits:', err);
          setMessageBox('Impossible de charger les produits. Veuillez réessayer plus tard.');
          setMessageType('error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  // Sauvegarder le panier et les infos client
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
  }, [cart, customerInfo]);

  // Vérifier le stock avant d'ajouter au panier
  const checkStock = useCallback((product, quantity) => {
    const cartItem = cart.find(item => item.id === product.id);
    const alreadyInCart = cartItem ? cartItem.quantity : 0;
    return product.stock_quantity >= (alreadyInCart + quantity);
  }, [cart]);

  // Gestion panier avec vérification de stock
  const handleAddToCart = useCallback((product, quantity) => {
    if (!checkStock(product, quantity)) {
      setMessageBox(`Stock insuffisant pour ${product.name}. Il ne reste que ${product.stock_quantity} unité(s).`);
      setMessageType('warning');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
    setMessageBox(`${quantity} ${product.name} a été ajouté(s) au panier !`);
    setMessageType('info');
  }, [checkStock]);

  const handleUpdateQuantity = useCallback((productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (newQuantity > product.stock_quantity) {
      setMessageBox(`Stock insuffisant. Il ne reste que ${product.stock_quantity} unité(s) de ce produit.`);
      setMessageType('warning');
      return;
    }
    
    if (newQuantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [products]);

  const handleRemoveFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    setMessageBox('Produit retiré du panier.');
    setMessageType('info');
  }, []);

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const generateWhatsAppMessage = useCallback((orderId) => {
    const orderDetails = cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const message = `Bonjour, je souhaite commander :
${orderDetails}.
Total: ${total.toLocaleString()} F CFA.

Informations de livraison:
Nom: ${customerInfo.name}
Téléphone: ${customerInfo.phone}
${customerInfo.address ? `Adresse: ${customerInfo.address}` : ''}
Numéro de commande: #${orderId}`;
    
    return message;
  }, [cart, customerInfo]);

  // Fonction pour sauvegarder la commande via l'API
  const saveOrderToDatabase = async (orderData) => {
    try {
      // Utiliser apiClient pour inclure automatiquement le token JWT
      const response = await apiClient.post('/api/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la commande:', error);
      
      // Si c'est une erreur d'authentification, proposer de se reconnecter
      if (error.response?.status === 401) {
        setMessageBox('Session expirée. Veuillez vous reconnecter.');
        setMessageType('error');
        // Vous pourriez rediriger vers la page de connexion ici
        // navigate('/login');
      } else if (error.response?.status === 403) {
        setMessageBox('Vous n\'avez pas les permissions nécessaires pour créer une commande.');
        setMessageType('error');
      } else {
        setMessageBox('Erreur lors de l\'enregistrement de la commande. Veuillez réessayer.');
        setMessageType('error');
      }
      
      throw error;
    }
  };

  const handleOrder = useCallback(async () => {
    if (cart.length === 0) {
      setMessageBox('Votre panier est vide.');
      setMessageType('info');
      return;
    }
    
    if (!companyId) {
      setMessageBox('Erreur: L\'ID de l\'entreprise est manquant. Impossible de passer la commande.');
      setMessageType('error');
      return;
    }

    // Vérifier à nouveau le stock avant de finaliser la commande
    const outOfStockItems = cart.filter(item => {
      const product = products.find(p => p.id === item.id);
      return product && item.quantity > product.stock_quantity;
    });
    
    if (outOfStockItems.length > 0) {
      const productNames = outOfStockItems.map(item => item.name).join(', ');
      setMessageBox(`Certains produits ne sont plus disponibles en quantité suffisante: ${productNames}. Veuillez ajuster votre panier.`);
      setMessageType('warning');
      return;
    }

    // Demander les informations client si non renseignées
    if (!customerInfo.name || !customerInfo.phone) {
      setShowCustomerForm(true);
      return;
    }

    try {
      const orderData = {
        companyId: companyId,
        shippingAddress: customerInfo.address,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })),
      };

      // Sauvegarder la commande via l'API
      const savedOrder = await saveOrderToDatabase(orderData);
      
      const message = generateWhatsAppMessage(savedOrder.id || savedOrder.orderId);
      const whatsappLink = `https://wa.me/237620370286?text=${encodeURIComponent(message)}`;
      
      // Vider le panier après la commande
      setCart([]);
      setMessageBox('Commande enregistrée ! Redirection vers WhatsApp...');
      setMessageType('info');
      
      // Ouvrir WhatsApp après un court délai
      setTimeout(() => window.open(whatsappLink, '_blank'), 1500);
    } catch (error) {
      // L'erreur est déjà gérée dans saveOrderToDatabase
      console.error('Erreur lors de la commande:', error);
    }
  }, [cart, products, customerInfo, companyId, generateWhatsAppMessage]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
  }, []);

  const handlePreviewProduct = useCallback((product) => {
    setPreviewProduct(product);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('https://res.cloudinary.com/djhyztec8/image/upload/v1755553268/WhatsApp_Image_2025-08-18_%C3%A0_23.40.08_2e0974c3_dagux0.jpg')" }} >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-center text-white mb-8">Nos Produits</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-cover bg-center bg-fixed flex items-center justify-center" style={{ backgroundImage: "url('https://res.cloudinary.com/djhyztec8/image/upload/v1755553268/WhatsApp_Image_2025-08-18_%C3%A0_23.40.08_2e0974c3_dagux0.jpg')" }} >
        <div className="relative z-10 bg-white/90 p-8 rounded-2xl text-center">
          <h1 className="text-3xl font-bold text-brand-brown mb-4">Nos Produits</h1>
          <p className="text-neutral-600 text-xl">Aucun produit disponible pour le moment.</p>
          <p className="text-neutral-500 mt-2">Veuillez réessayer ultérieurement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('https://res.cloudinary.com/djhyztec8/image/upload/v1755553268/WhatsApp_Image_2025-08-18_%C3%A0_23.40.08_2e0974c3_dagux0.jpg')" }} >
      {messageBox && (
        <MessageBox message={messageBox} onClose={() => setMessageBox(null)} type={messageType} />
      )}
      
      {/* Formulaire d'informations client */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Informations de livraison</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet *</label>
                <input 
                  type="text" 
                  value={customerInfo.name} 
                  onChange={(e) => handleCustomerInfoChange('name', e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" 
                  placeholder="Votre nom" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone *</label>
                <input 
                  type="tel" 
                  value={customerInfo.phone} 
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" 
                  placeholder="Votre numéro de téléphone" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input 
                  type="text" 
                  value={customerInfo.address} 
                  onChange={(e) => handleCustomerInfoChange('address', e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" 
                  placeholder="Votre adresse" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCustomerForm(false)}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleOrder}
                className="px-4 py-2 bg-brand-green text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vue principale (produits) */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header avec recherche et panier */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 sticky top-0 z-20">
          <div className="flex-1 w-full md:w-auto relative">
            <input
              type="text"
              placeholder="Rechercher des produits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 rounded-2xl shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green transition"
            />
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition">
                <X size={20} aria-label="Effacer la recherche" />
              </button>
            )}
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            {categories.length > 0 && (
              <div className="relative inline-block text-left w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-48 p-3 rounded-2xl shadow-lg border border-gray-200 appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-brand-green transition"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" aria-hidden="true" />
              </div>
            )}
            
            <button
              className="relative p-3 bg-white rounded-2xl shadow-lg text-brand-brown hover:bg-gray-50 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-green"
              onClick={() => {
                const sidebar = document.getElementById('cart-sidebar');
                if (sidebar) sidebar.classList.toggle('translate-x-full');
              }}
              aria-label="Ouvrir le panier"
            >
              <ShoppingCart size={24} aria-hidden="true" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Message de filtres */}
        {(searchQuery || selectedCategory !== 'all') && (
          <div className="text-center text-white/90 mb-4">
            <p>
              Affichage des produits pour{' '}
              <span className="font-semibold">{selectedCategory === 'all' ? 'Toutes les catégories' : selectedCategory}</span>
              {searchQuery && (
                <>
                  {' '}et la recherche <span className="font-semibold">"{searchQuery}"</span>
                </>
              )}
            </p>
            <button onClick={handleClearFilters} className="text-sm mt-1 underline hover:no-underline transition">
              Effacer les filtres
            </button>
          </div>
        )}

        {/* Grille des produits */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 flex flex-col items-center text-center transition-transform hover:scale-105 cursor-pointer"
              onClick={() => handlePreviewProduct(product)}
              aria-label={`Détails du produit ${product.name}`}
            >
              {product.photos && product.photos[0] ? (
                <img
                  src={product.photos[0]}
                  alt={product.name}
                  className="w-40 h-40 object-contain mb-4 rounded-lg"
                  loading="lazy"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center mb-4 text-gray-500">
                  <span className="text-xs">Pas d'image</span>
                </div>
              )}
              <h2 className="text-xl font-semibold mb-1 text-brand-brown">{product.name}</h2>
              <p className="text-sm text-neutral-600 mb-2 truncate w-full px-2">{product.description}</p>
              <p className="text-lg font-bold text-brand-green">
                {product.price.toLocaleString()} F CFA
              </p>
              <div className="text-sm font-medium mt-2">
                {product.stock_quantity > 0 ? (
                  <span className={`py-1 px-3 rounded-full text-white ${
                    product.stock_quantity <= 5 ? 'bg-yellow-500' : 'bg-green-600'
                  }`}>
                    {product.stock_quantity} en stock
                  </span>
                ) : (
                  <span className="py-1 px-3 rounded-full bg-red-500 text-white">
                    Rupture de stock
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar du panier */}
      <div
        id="cart-sidebar"
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-gray-50 shadow-2xl z-40 transform translate-x-full transition-transform duration-300 overflow-y-auto p-6 flex flex-col"
        role="complementary"
        aria-label="Panier d'achat"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-brown">Votre Panier</h2>
          <button
            onClick={() => {
              const sidebar = document.getElementById('cart-sidebar');
              if (sidebar) sidebar.classList.add('translate-x-full');
            }}
            className="p-2 text-gray-500 hover:text-gray-800 transition focus:outline-none focus:ring-2 focus:ring-brand-green rounded-full"
            aria-label="Fermer le panier"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <ShoppingCart size={48} className="mb-4" aria-hidden="true" />
            <p>Votre panier est vide.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                  {item.photos && item.photos[0] ? (
                    <img
                      src={item.photos[0]}
                      alt={item.name}
                      className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-500 text-xs">
                      Pas d'image
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-brand-brown truncate">{item.name}</h3>
                    <p className="text-sm font-medium text-brand-green">
                      {item.price.toLocaleString()} F CFA
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 bg-gray-200 rounded-full hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-brand-green"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <span className="font-bold">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 bg-gray-200 rounded-full hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-brand-green"
                        aria-label="Augmenter la quantité"
                        disabled={item.quantity >= (products.find(p => p.id === item.id)?.stock_quantity || Infinity)}
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full"
                    aria-label="Retirer du panier"
                  >
                    <Trash2 size={20} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            {/* Récapitulatif et bouton de commande */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center font-bold text-lg text-brand-brown">
                Total: {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()} F CFA
              </div>
              
              {/* Informations client résumées */}
              {(customerInfo.name || customerInfo.phone) && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2">Informations de livraison:</h4>
                  <p className="text-sm">{customerInfo.name}</p>
                  <p className="text-sm">{customerInfo.phone}</p>
                  {customerInfo.address && <p className="text-sm">{customerInfo.address}</p>}
                  <button
                    onClick={() => setShowCustomerForm(true)}
                    className="text-blue-500 text-sm mt-2 hover:text-blue-700 focus:outline-none focus:underline"
                  >
                    Modifier
                  </button>
                </div>
              )}
              
              <button
                onClick={handleOrder}
                className="mt-6 w-full py-3 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                disabled={cart.some(item => {
                  const product = products.find(p => p.id === item.id);
                  return product && item.quantity > product.stock_quantity;
                })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white" aria-hidden="true"><path d="M12.04 2C7.388 2 3.63 5.768 3.63 10.42v3.136L2 19.344l4.135-1.527L6.64 19.344l.115.228 3.504 3.498 3.682-.924 3.75 1.096L22.08 19.344l-1.63-1.527V10.42c0-4.652-3.758-8.42-8.42-8.42zm.006 1.758c3.774 0 6.84 3.066 6.84 6.84V16.63L18.4 18.252l-2.09-.646-1.506.646-1.464-.328-1.498.328-1.53.646-1.488-.646-1.436.328-1.488-.328L6.46 18.252l-.962-.958-1.543.646V10.42c0-3.774 3.066-6.84 6.84-6.84zm-.006 2.898c-1.87 0-3.386 1.516-3.386 3.386 0 1.87 1.516 3.386 3.386 3.386 1.87 0 3.386-1.516 3.386-3.386 0-1.87-1.516-3.386-3.386-3.386zM12.04 12c.968 0 1.758.79 1.758 1.758 0 .968-.79 1.758-1.758 1.758-.968 0-1.758-.79-1.758-1.758 0-.968.79-1.758 1.758-1.758z"/></svg> Commander via WhatsApp
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de prévisualisation du produit */}
      {previewProduct && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-preview-title"
        >
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full relative">
            <button
              onClick={() => setPreviewProduct(null)}
              className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-brand-green"
              aria-label="Fermer la prévisualisation"
            >
              <X size={24} aria-hidden="true" />
            </button>
            <ProductPreview 
              product={previewProduct} 
              onClose={() => setPreviewProduct(null)} 
              onAddToCart={handleAddToCart} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
