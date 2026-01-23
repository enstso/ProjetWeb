import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

/**
 * Type minimal du User côté front.
 * Remarque: `fullName` est optionnel car selon les endpoints il peut être absent.
 */
type User = { id: number | string; email: string; fullName?: string };

export function useAuth() {
    /**
     * user: état de l’utilisateur connecté (ou null si non connecté)
     * loading: indique si on est en train de charger /me (au boot ou après login)
     */
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * loadMe:
     * - vérifie s'il existe un access_token en localStorage
     * - si oui -> appelle l'API /me pour récupérer le profil
     * - si /me échoue -> token invalide/expiré -> purge localStorage + user=null
     */
    const loadMe = useCallback(async () => {
        const token = localStorage.getItem("access_token");

        // Pas de token => pas connecté => on arrête le loading
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            // Récupère le profil courant (normalement protégé par auth middleware côté back)
            const { data } = await api.get("/me");
            setUser(data);
        } catch {
            // Si erreur: on considère le token invalide/expiré
            localStorage.removeItem("access_token");
            setUser(null);
        } finally {
            // Dans tous les cas, l'état loading se termine
            setLoading(false);
        }
    }, []);

    /**
     * Au montage:
     * - on tente de récupérer /me si un token est présent
     * - permet de restaurer une session après refresh navigateur
     */
    useEffect(() => {
        loadMe();
    }, [loadMe]);

    /**
     * login:
     * - POST /auth/login avec email+password
     * - stocke le token renvoyé
     * - recharge /me pour remplir l'état user
     *
     * Attention: ici tu stockes `data.access_token.token`
     * => ça dépend EXACTEMENT de la forme de réponse du backend.
     */
    const login = useCallback(
        async (email: string, password: string) => {
            const { data } = await api.post("/auth/login", { email, password });

            // Stockage du token pour les requêtes suivantes
            localStorage.setItem("access_token", data.access_token.token);

            // Recharge le profil (et met à jour `user`)
            await loadMe();
        },
        [loadMe]
    );

    /**
     * register:
     * - POST /auth/register
     * - stocke le token renvoyé
     * - met directement `user` depuis la réponse
     *
     * Attention: ici tu fais `localStorage.setItem("access_token", data.token);`
     * => ça suppose que /auth/register renvoie un champ `token`.
     * Or ton backend précédent renvoyait plutôt `{ user: { ... } }` sans token.
     * Donc ce bloc dépend de ta réponse API réelle.
     */
    const register = useCallback(async (fullName: string, email: string, password: string) => {
        const { data } = await api.post("/auth/register", { fullName, email, password });

        // Stockage du token (si fourni par l'API)
        localStorage.setItem("access_token", data.token);

        // Met à jour l'utilisateur en local (si l'API renvoie data.user)
        setUser(data.user);
    }, []);

    /**
     * updateProfile:
     * - PUT /me avec { fullName?, email? }
     * - met à jour `user` avec la réponse (source de vérité côté front)
     *
     * Remarque: cet endpoint doit être protégé côté backend.
     */
    const updateProfile = useCallback(async (payload: { fullName?: string; email?: string }) => {
        const { data } = await api.put("/me", payload);

        // Synchronise l'état local avec ce que renvoie l'API
        setUser(data);

        return data;
    }, []);

    /**
     * logout:
     * - supprime le token du storage
     * - reset le user côté front
     *
     * Note: si tu as un endpoint /auth/logout côté back, tu pourrais l'appeler ici,
     * mais ce code reste "stateless" côté client.
     */
    const logout = useCallback(() => {
        localStorage.removeItem("access_token");
        setUser(null);
    }, []);

    /**
     * API du hook:
     * - user/loading: état
     * - login/register/logout: actions auth
     * - reload: recharge /me (utile après refresh token ou init)
     * - updateProfile: édition du profil
     */
    return { user, loading, login, register, logout, reload: loadMe, updateProfile };
}
