import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type {JSX} from "react";

export function ProtectedRoute({ children }: Readonly<{ children: JSX.Element }>) {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-6">Chargement...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}
