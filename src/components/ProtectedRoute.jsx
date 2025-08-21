// src/components/ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Assurez-vous que le chemin est correct

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    // Si l'utilisateur n'est pas authentifié, redirige vers la page de connexion.
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Si l'utilisateur n'a pas le bon rôle, redirige vers une page d'accès refusé ou le tableau de bord.
    return <Navigate to="/tableau-de-bord" replace />;
  }

  return <Outlet />;
}