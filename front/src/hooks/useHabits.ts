import { useCallback, useState } from "react";
import { api } from "../lib/api";

/**
 * Type Habit (frontend)
 * - Représente une habitude telle que renvoyée par l’API Adonis (/habits).
 * - Certains champs existent en camelCase OU snake_case selon la sérialisation.
 */
export type Habit = {
    /** Identifiant unique de l’habitude */
    id: number;

    /** Nom de l’habitude (obligatoire côté backend) */
    name: string;

    /** Description optionnelle */
    description?: string | null;

    /** Catégorie optionnelle */
    category?: string | null;

    /** Fréquence de l’habitude */
    frequency: "daily" | "weekly";

    /**
     * Objectif hebdo (si weekly)
     * - weeklyTarget (camelCase) ou weekly_target (snake_case)
     */
    weeklyTarget?: number | null;
    weekly_target?: number | null;

    /**
     * Date de début
     * - startDate (camelCase) ou start_date (snake_case)
     */
    startDate?: string;
    start_date?: string;

    /**
     * Archive
     * - isArchived (camelCase) ou is_archived (snake_case)
     */
    isArchived?: boolean;
    is_archived?: boolean;
};

export function useHabits() {
    /**
     * loading: état réseau pour afficher loader/skeleton
     * error: message prêt à afficher côté UI
     */
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * list (générique)
     * - GET /habits?archived=true|false
     * - archived=false par défaut => habitudes actives
     * - Retourne toujours un tableau (sinon [])
     */
    const list = useCallback(async (archived = false) => {
        setLoading(true);
        setError(null);

        try {
            // On passe archived en query string
            const { data } = await api.get("/habits", { params: { archived } });

            // Sécurité: on ne garde que les tableaux
            return Array.isArray(data) ? (data as Habit[]) : [];
        } catch (e) {
            // On tente de récupérer le message backend, sinon fallback
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setError(e?.response?.data?.message ?? "Impossible de charger les habitudes.");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * listActive
     * - Alias de list(false)
     * - Permet de garder une API "stable" pour l’écran des habitudes actives
     */
    const listActive = useCallback(async () => list(false), [list]);

    /**
     * listArchived
     * - Alias de list(true)
     * - Sert à afficher les habitudes archivées (onglet/route "Archives")
     */
    const listArchived = useCallback(async () => list(true), [list]);

    /**
     * getOne
     * - GET /habits/:id
     * - Récupère le détail d’une habitude
     */
    const getOne = useCallback(async (id: string | number) => {
        const { data } = await api.get(`/habits/${id}`);
        return data as Habit;
    }, []);

    /**
     * create
     * - POST /habits
     * - Payload conforme au backend: weekly_target (snake_case) + start_date (snake_case)
     */
    const create = useCallback(async (payload: {
        name: string;
        description?: string;
        category?: string;
        frequency: "daily" | "weekly";
        weekly_target?: number;
        start_date: string;
    }) => {
        const { data } = await api.post("/habits", payload);
        return data as Habit;
    }, []);

    /**
     * update
     * - PUT /habits/:id
     * - Met à jour l’habitude (payload complet ici, tel que tu l’as défini)
     * - Retourne l’habitude mise à jour
     */
    const update = useCallback(async (id: string | number, payload: {
        name: string;
        description: string | undefined;
        category: string | undefined;
        frequency: "daily" | "weekly";
        weekly_target: number | undefined;
        start_date: string;
    }) => {
        const { data } = await api.put(`/habits/${id}`, payload);
        return data as Habit;
    }, []);

    /**
     * archive
     * - PATCH /habits/:id/archive
     * - Passe is_archived à true côté backend
     */
    const archive = useCallback(async (id: string | number) => {
        const { data } = await api.patch(`/habits/${id}/archive`);
        return data as Habit;
    }, []);

    /**
     * unarchive
     * - PATCH /habits/:id/unarchive
     * - Restaure une habitude (is_archived=false)
     */
    const unarchive = useCallback(async (id: string | number) => {
        const { data } = await api.patch(`/habits/${id}/unarchive`);
        return data as Habit;
    }, []);

    /**
     * checkToday
     * - POST /habits/:id/log
     * - Crée un log "aujourd’hui" (timezone gérée côté backend via X-Timezone)
     * - Idempotent (peut renvoyer already_exists=true)
     */
    const checkToday = useCallback(async (habitId: string | number) => {
        const { data } = await api.post(`/habits/${habitId}/log`);
        return data as { id: number; date_iso: string; already_exists: boolean };
    }, []);

    /**
     * uncheck
     * - DELETE /habits/:id/log/:dateISO
     * - Supprime un log pour la date donnée (YYYY-MM-DD)
     */
    const uncheck = useCallback(async (habitId: string | number, dateISO: string) => {
        await api.delete(`/habits/${habitId}/log/${dateISO}`);
    }, []);

    /**
     * getStats
     * - GET /habits/:id/stats
     * - Renvoie streak courant, best streak, taux de complétion (%)
     */
    const getStats = useCallback(async (id: string | number) => {
        const { data } = await api.get(`/habits/${id}/stats`);
        return data as {
            habit_id: number;
            frequency: "daily" | "weekly";
            weekly_target?: number | null;
            today: string;
            stats: {
                current_streak: number;
                best_streak: number;
                completion_rate_percent: number;
            };
        };
    }, []);

    /**
     * getLogs
     * - GET /habits/:id/logs?start_date=...&end_date=...
     * - Sert au calendrier/grille mensuelle
     */
    const getLogs = useCallback(async (habitId: string | number, start_date: string, end_date: string) => {
        const { data } = await api.get(`/habits/${habitId}/logs`, { params: { start_date, end_date } });
        return Array.isArray(data) ? data : [];
    }, []);

    /**
     * API exposée au reste de l’app
     * - listActive / listArchived pour UI tabs
     * - archive / unarchive pour gérer le cycle de vie d’une habitude
     * - check/uncheck + stats/logs pour le suivi
     */
    return {
        loading,
        error,
        list,
        listActive,
        listArchived,
        getOne,
        create,
        update,
        archive,
        unarchive,
        checkToday,
        uncheck,
        getStats,
        getLogs,
    };
}
