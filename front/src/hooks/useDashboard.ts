import { useCallback, useState } from "react";
import { api } from "../lib/api";

/**
 * Représente un objectif renvoyé par l’endpoint /dashboard (preview des objectifs actifs).
 * - Les champs sont volontairement "light" (liste) pour garder la réponse rapide.
 */
export type DashboardGoal = {
    id: number;
    title: string;
    status: "active" | "completed" | "abandoned";
    priority?: "low" | "medium" | "high";
    deadline?: string | null;
};

/**
 * Représente une habitude renvoyée par /dashboard, enrichie avec un flag "completed_today".
 * - completed_today: permet d’afficher l’état du jour directement dans l’UI.
 * - weeklyTarget / weekly_target: tolère camelCase ou snake_case selon sérialisation côté API.
 */
export type DashboardHabit = {
    id: number;
    name: string;
    category?: string | null;
    frequency: "daily" | "weekly";
    weeklyTarget?: number | null;
    weekly_target?: number | null;
    completed_today: boolean;
};

/**
 * Shape complet de la réponse /dashboard.
 * - today: date ISO (YYYY-MM-DD) calculée côté backend en fonction du timezone user
 * - zone: timezone effectif utilisé (ex: "Europe/Paris" ou "UTC")
 * - goals_active: aperçu des objectifs actifs + total
 * - habits_today: habitudes actives du user + état complété du jour
 * - stats: agrégats pour afficher des KPIs
 */
export type DashboardResponse = {
    today: string;
    zone: string;
    goals_active: {
        total: number;
        limit: number;
        items: DashboardGoal[];
    };
    habits_today: DashboardHabit[];
    stats: {
        completed_goals: number;
        max_streak: number;
        habits_completed_today: number;
    };
};

export function useDashboard() {
    /**
     * loading: état de chargement pendant l’appel API
     * error: message prêt à afficher côté UI en cas d’erreur
     */
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * fetchDashboard:
     * - Appelle GET /dashboard avec un paramètre optionnel goal_limit (défaut: 5)
     * - Renvoie la réponse typée (DashboardResponse) ou null si erreur
     * - Met à jour loading/error pour une UI réactive
     */
    const fetchDashboard = useCallback(async (goalLimit = 5) => {
        setLoading(true);
        setError(null);

        try {
            // Appel API: on passe goal_limit en query string (?goal_limit=5)
            const { data } = await api.get<DashboardResponse>("/dashboard", {
                params: { goal_limit: goalLimit },
            });

            // Succès: on renvoie les données au composant appelant
            return data;
        } catch (e) {
            // Erreur: on tente de récupérer un message backend, sinon fallback générique
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setError(e?.response?.data?.message ?? "Impossible de charger le dashboard.");

            // Le composant peut tester null pour gérer un state vide
            return null;
        } finally {
            // Dans tous les cas: on sort de l’état de chargement
            setLoading(false);
        }
    }, []);

    /**
     * API du hook:
     * - loading/error: pour l’affichage (skeleton, message, etc.)
     * - fetchDashboard: fonction à appeler au montage ou lors d’un refresh
     */
    return { loading, error, fetchDashboard };
}
