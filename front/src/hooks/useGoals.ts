import { useCallback, useMemo, useState } from "react";
import { api } from "../lib/api";

/**
 * Type Goal (frontend)
 * - Correspond à la structure renvoyée par l’API Adonis (/goals).
 * - Certains champs peuvent arriver en camelCase OU snake_case selon la sérialisation.
 */
export type Goal = {
    /** Identifiant unique de l’objectif */
    id: number;

    /** Titre (obligatoire côté backend) */
    title: string;

    /** Description optionnelle */
    description?: string | null;

    /** Catégorie optionnelle */
    category?: string | null;

    /** Priorité (enum) */
    priority: "low" | "medium" | "high";

    /** Statut (enum) */
    status: "active" | "completed" | "abandoned";

    /**
     * Date de début (peut être camelCase ou snake_case)
     * - backend Lucid renvoie souvent camelCase
     * - certaines routes/serializers peuvent renvoyer snake_case
     */
    startDate?: string;
    start_date?: string;

    /** Date de complétion (nullable) */
    completedAt?: string | null;

    /** Deadline (format YYYY-MM-DD en général) */
    deadline?: string;
};

/**
 * Helpers "sûrs" pour lire les dates peu importe le casing.
 * (Pratique pour éviter de dupliquer des `??` partout dans l’UI.)
 */
function getStartDate(g: Goal) {
    return g.startDate ?? g.start_date ?? "";
}

function getDeadline(g: Goal) {
    return g.deadline ?? "";
}

export function useGoals() {
    /**
     * items: liste locale des objectifs chargés via fetchGoals()
     * loading: état réseau pour afficher un loader/skeleton
     * error: message prêt à afficher côté UI
     */
    const [items, setItems] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * fetchGoals
     * - GET /goals avec filtres optionnels (status, priority, order)
     * - Met à jour items/loading/error
     */
    const fetchGoals = useCallback(
        async (params?: {
            status?: string;
            priority?: string;
            order?: "asc" | "desc";
        }) => {
            setLoading(true);
            setError(null);

            try {
                // Appel API avec params (query string)
                const { data } = await api.get("/goals", { params });

                // Sécurité: on ne garde que les tableaux
                setItems(Array.isArray(data) ? (data as Goal[]) : []);
            } catch (e) {
                // On tente de récupérer le message backend, sinon fallback
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                setError(e?.response?.data?.message ?? "Impossible de charger les objectifs.");
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * getGoal
     * - GET /goals/:id
     * - Retourne un Goal (sans toucher à items)
     */
    const getGoal = useCallback(async (id: string | number) => {
        const { data } = await api.get(`/goals/${id}`);
        return data as Goal;
    }, []);

    /**
     * createGoal
     * - POST /goals
     * - Retourne l’objectif créé
     * - L’UI peut ensuite décider de refresh() ou d’insérer localement
     */
    const createGoal = useCallback(
        async (payload: {
            title: string;
            description?: string;
            category?: string;
            priority: "low" | "medium" | "high";
            status: "active" | "completed" | "abandoned";
            start_date: string; // YYYY-MM-DD
            deadline: string; // YYYY-MM-DD
        }) => {
            const { data } = await api.post("/goals", payload);
            return data as Goal;
        },
        []
    );

    /**
     * updateGoal
     * - PUT /goals/:id
     * - Payload partiel (on envoie uniquement ce qui change)
     * - Retourne l’objectif mis à jour
     */
    const updateGoal = useCallback(
        async (
            id: string | number,
            payload: Partial<{
                title: string;
                description?: string;
                category?: string;
                priority: "low" | "medium" | "high";
                status: "active" | "completed" | "abandoned";
                start_date: string;
                deadline: string;
            }>
        ) => {
            const { data } = await api.put(`/goals/${id}`, payload);
            return data as Goal;
        },
        []
    );

    /**
     * deleteGoal
     * - DELETE /goals/:id
     * - Ne retourne rien: l’UI peut filtrer localement ou refresh()
     */
    const deleteGoal = useCallback(async (id: string | number) => {
        await api.delete(`/goals/${id}`);
    }, []);

    /**
     * completeGoal
     * - PATCH /goals/:id/complete
     * - Passe l’objectif en "completed" côté backend
     */
    const completeGoal = useCallback(async (id: string | number) => {
        const { data } = await api.patch(`/goals/${id}/complete`);
        return data as Goal;
    }, []);

    /**
     * getProgress
     * - GET /goals/:id/progress
     * - Retourne un objet calculé (progression % + compteurs)
     */
    const getProgress = useCallback(async (id: string | number) => {
        const { data } = await api.get(`/goals/${id}/progress`);
        return data as {
            goal_id: number;
            total_steps: number;
            completed_steps: number;
            progress_percent: number;
        };
    }, []);

    /**
     * helpers
     * - groupement mémorisé des fonctions utilitaires pour l’UI
     * - useMemo évite de recréer l’objet à chaque render
     */
    const helpers = useMemo(() => ({ getStartDate, getDeadline }), []);

    return {
        items,
        loading,
        error,
        fetchGoals,
        getGoal,
        createGoal,
        updateGoal,
        deleteGoal,
        completeGoal,
        helpers,
        getProgress,
    };
}
