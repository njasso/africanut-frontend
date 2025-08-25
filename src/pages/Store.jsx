import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ShoppingCart, Trash2, Search, ChevronDown, X, ChevronLeft, ChevronRight, Plus, Minus, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// Composant pour afficher des messages modaux
const MessageBox = ({ message, onClose, type = 'info' }) => {
  const getIcon = () => {
    switch(type) {
      case 'warning': return <AlertTriangle size={24} className="text-yellow-500" aria-hidden="true" />;
      case 'error': return <AlertTriangle size={24} className="text-red-500" aria-hidden="true" />;
      default: return null;
    }
  };

  // Fermer avec la touche Escape
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
const ProductPreview = ({ product, onClose, onAddToCart, scrollCarousel, carouselRef }) => {
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Navigation clavier dans le modal
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

      {/* Choix de la quantité */}
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
            } else {
              // Gérer l'affichage d'erreur via un callback parent si nécessaire
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
  const [companyId] = useState('4809480a-c8cb-4990-afd7-e9337993825e');

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

  // Charger les produits et le panier
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Définir l'URL de l'API. La variable d'environnement n'est pas utilisée pour éviter les erreurs de compilation.
    const API_URL = 'http://localhost:5005';

    const fetchData = async () => {
      try {
        const [productsRes, savedCart, savedCustomerInfo] = await Promise.allSettled([
          axios.get(`${API_URL}/api/products`, { signal }),
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
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item ));
  }, [products]);

  const handleRemoveFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    setMessageBox('Produit retiré du panier.');
    setMessageType('info');
  }, []);

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const generateWhatsAppMessage = useCallback((orderId) => {
    const orderDetails = cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const message = `Bonjour, je souhaite commander : ${orderDetails}. Total: ${total.toLocaleString()} F CFA. Informations de livraison: Nom: ${customerInfo.name} Téléphone: ${customerInfo.phone} ${customerInfo.address ? `Adresse: ${customerInfo.address}` : ''} Numéro de commande: #${orderId}`;
    return message;
  }, [cart, customerInfo]);

  const saveOrderToDatabase = async (orderData) => {
    try {
      const response = await axios.post('/api/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la commande:', error);
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

      const savedOrder = await saveOrderToDatabase(orderData);
      const message = generateWhatsAppMessage(savedOrder.id);
      const whatsappLink = `https://wa.me/237620370286?text=${encodeURIComponent(message)}`;

      setCart([]);
      setMessageBox('Commande enregistrée ! Redirection vers WhatsApp...');
      setMessageType('info');
      setTimeout(() => window.open(whatsappLink, '_blank'), 1500);
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      setMessageBox('Erreur lors de l\'enregistrement de la commande. Veuillez réessayer.');
      setMessageType('error');
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
      <div className="min-h-screen p-4 md:p-8 bg-gray-50 flex flex-col font-sans text-neutral-800">
        <h1 className="text-3xl font-bold mb-8 text-brand-brown text-center">Boutique</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 flex flex-col font-sans text-neutral-800">
      <h1 className="text-3xl font-bold mb-4 md:mb-8 text-brand-brown text-center">Boutique</h1>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 bg-white rounded-2xl shadow-md">
        <div className="relative w-full sm:w-1/2">
          <input
            type="text"
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:border-brand-green focus:ring-1 focus:ring-brand-green transition"
            aria-label="Rechercher des produits"
          />
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full sm:w-48 appearance-none bg-white border border-gray-300 rounded-full py-2 px-4 pr-8 transition focus:outline-none focus:ring-1 focus:ring-brand-green"
              aria-label="Filtrer par catégorie"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
          </div>

          <button
            onClick={handleClearFilters}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
          >
            Réinitialiser
          </button>
        </div>
      </div>
      
      {/* Grille des produits */}
      <div className="flex-grow">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => handlePreviewProduct(product)}
                aria-label={`Voir les détails de ${product.name}`}
              >
                <div className="relative w-full h-48 sm:h-56 overflow-hidden">
                  <img
                    src={product.photos[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Search size={32} className="text-white" />
                  </div>
                </div>
                <div className="p-4 flex flex-col items-center text-center">
                  <h3 className="text-lg font-semibold text-brand-brown truncate w-full">{product.name}</h3>
                  <p className="font-bold text-lg text-brand-green mt-2">{product.price.toLocaleString()} F CFA</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-neutral-600">Aucun produit trouvé pour votre recherche.</p>
          </div>
        )}
      </div>

      {/* Panier et bouton de commande */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-xl rounded-t-2xl p-4 transition-transform duration-300">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <ShoppingCart size={24} className="text-brand-green" aria-hidden="true" />
              <p className="text-xl font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
            </div>
            <p className="text-lg font-semibold">Total: {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()} F CFA</p>
            <button
              onClick={() => setShowCustomerForm(true)}
              className="px-6 py-2 bg-brand-green text-white rounded-full font-semibold shadow-md hover:bg-green-700 transition"
            >
              Passer la commande
            </button>
          </div>
        </div>
      )}

      {/* Modal pour le panier et les infos client */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-300 ${showCustomerForm ? 'opacity-100 visible' : 'opacity-0 invisible'}`} aria-hidden={!showCustomerForm}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in relative">
          <button
            onClick={() => setShowCustomerForm(false)}
            className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-800 transition"
            aria-label="Fermer le formulaire de commande"
          >
            <X size={24} aria-hidden="true" />
          </button>
          <h2 className="text-2xl font-bold mb-4 text-brand-brown">Votre Panier</h2>
          <div className="max-h-64 overflow-y-auto mb-4 border-b pb-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-800 font-medium truncate">{item.name}</p>
                  <p className="text-sm text-neutral-600">{item.price.toLocaleString()} F CFA</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-1 bg-gray-200 rounded-full text-neutral-700 hover:bg-gray-300 transition" aria-label="Réduire la quantité"><Minus size={16} aria-hidden="true" /></button>
                  <span className="font-semibold text-neutral-800">{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-1 bg-gray-200 rounded-full text-neutral-700 hover:bg-gray-300 transition" aria-label="Augmenter la quantité"><Plus size={16} aria-hidden="true" /></button>
                </div>
                <button onClick={() => handleRemoveFromCart(item.id)} className="ml-4 text-red-500 hover:text-red-700 transition" aria-label="Retirer du panier"><Trash2 size={20} aria-hidden="true" /></button>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2 text-brand-brown">Informations client</h3>
            <input
              type="text"
              placeholder="Nom complet"
              value={customerInfo.name}
              onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg mb-2 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
              required
            />
            <input
              type="tel"
              placeholder="Numéro de téléphone"
              value={customerInfo.phone}
              onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg mb-2 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
              required
            />
            <input
              type="text"
              placeholder="Adresse (optionnel)"
              value={customerInfo.address}
              onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            />
          </div>
          <button
            onClick={handleOrder}
            className="w-full py-3 bg-brand-green text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
          >
            Valider et commander ({cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()} F CFA)
          </button>
        </div>
      </div>

      {/* Message Box */}
      {messageBox && (
        <MessageBox
          message={messageBox}
          onClose={() => setMessageBox(null)}
          type={messageType}
        />
      )}

      {/* Modal de prévisualisation du produit */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-300 ${previewProduct ? 'opacity-100 visible' : 'opacity-0 invisible'}`} aria-hidden={!previewProduct}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in relative">
          <button
            onClick={() => setPreviewProduct(null)}
            className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-800 transition"
            aria-label="Fermer la prévisualisation"
          >
            <X size={24} aria-hidden="true" />
          </button>
          {previewProduct && (
            <ProductPreview
              product={previewProduct}
              onClose={() => setPreviewProduct(null)}
              onAddToCart={handleAddToCart}
            />
          )}
        </div>
      </div>
    </div>
  );
}
