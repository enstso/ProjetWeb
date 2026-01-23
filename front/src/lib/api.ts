import axios from "axios";

/**
 * Instance Axios partagée
 * - Centralise la config HTTP pour toute l’app (hooks, services, etc.)
 * - Permet d’éviter de répéter baseURL + headers partout
 */
export const api = axios.create({
    /**
     * baseURL
     * - URL racine de l’API backend
     * - Priorité à la variable Vite (VITE_API_URL)
     * - Fallback local pour dev
     */
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333",
});

/**
 * Interceptor de requête
 * - S’exécute avant CHAQUE requête HTTP envoyée via "api"
 * - Sert à ajouter des headers communs (auth + timezone)
 */
api.interceptors.request.use((config) => {
    /**
     * Token d’auth (stocké en localStorage)
     * - Si présent, on ajoute Authorization: Bearer <token>
     * - Permet de protéger les endpoints via middleware.auth() côté Adonis
     */
    const token = localStorage.getItem("access_token");

    /**
     * Timezone du navigateur (IANA)
     * - Exemple: "Europe/Paris"
     * - Utilisé par le backend pour calculer "aujourd’hui" selon le user
     *   (ex: userTodayISO via header X-Timezone)
     */
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    /**
     * Sécurité: Axios peut avoir config.headers undefined selon le contexte
     * - On s’assure qu’un objet existe pour pouvoir écrire dedans
     */
    config.headers = config.headers ?? {};

    /**
     * Header timezone (pour le backend)
     * - Convention: "X-Timezone"
     */
    config.headers["X-Timezone"] = tz;

    /**
     * Header Authorization si token présent
     * - Format Bearer standard
     */
    if (token) config.headers.Authorization = `Bearer ${token}`;

    /**
     * Important: on retourne config modifié
     * - Sinon Axios n’enverra pas la requête correctement
     */
    return config;
});
