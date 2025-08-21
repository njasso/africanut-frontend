import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx'; 

import Home from './pages/Home.jsx';
import Companies from './pages/Companies.jsx';
import Company from './pages/Company.jsx';
import HR from './pages/HR.jsx';
import Accounting from './pages/Accounting.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import Login from './pages/Login.jsx';
import RessourcesPage from './pages/RessourcesPage.jsx';
import AProposPage from './pages/AProposPage.jsx';
import ContactsPage from './pages/ContactsPage.jsx';
import Store from './pages/Store.jsx';
import ProductManagement from './pages/ProductManagement.jsx';

// L'état initial des produits est maintenant un tableau vide
const initialProducts = [];

export default function App() {
  // État partagé pour les produits
  const [products, setProducts] = useState(initialProducts);

  return (
    <Layout>
      <Routes>
        {/* Pages publiques accessibles à tous */}
        <Route path="/" element={<Home />} />
        <Route path="/entreprises" element={<Companies />} />
        <Route path="/entreprises/:slug" element={<Company />} />
        <Route path="/entreprises/:slug/boutique" element={<Store products={products} />} />

        <Route path="/login" element={<Login />} />
        <Route path="/ressources/*" element={<RessourcesPage />} />
        <Route path="/apropos" element={<AProposPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/accueil" element={<Navigate to="/" />} />

        {/* Routes protégées qui exigent l'authentification (ancienne méthode) */}
        <Route path="/personnel" element={<PrivateRoute><HR /></PrivateRoute>} />
        <Route path="/comptabilite" element={<PrivateRoute><Accounting /></PrivateRoute>} />
        <Route path="/tableau-de-bord" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        {/* Routes privées pour les administrateurs et managers uniquement */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
          <Route path="/dashboard/gestion-produits/:slug" element={<ProductManagement products={products} setProducts={setProducts} />} />
        </Route>

        {/* 404 - Page non trouvée */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
