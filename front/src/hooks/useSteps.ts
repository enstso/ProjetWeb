import { useCallback, useState } from "react";
import { api } from "../lib/api";

/**
 * Type Step (frontend)
 * - Représente une étape (step) telle que renvoyée par l’API.
 * - On supporte camelCase (Lucid) ET snake_case (au cas où).
 */
export type Step = {
    /** Identifiant unique de l’étape */
    id: number;

    /** Titre de l’étape */
    title: string;

    /** Deadline optionnelle (YYYY-MM-DD ou ISO tronqué côté UI) */
    deadline?: string | null;

    /** Ordre d’affichage (pour trier les steps dans un objectif) */
    order?: number | null;

    /**
     * Statut de complétion (camelCase - souvent renvoyé par Lucid)
     * - isCompleted: bool
     * - completedAt: timestamp quand l’étape a été cochée
     */
    isCompleted?: boolean | null;
    completedAt?: string | null;

    /**
     * Statut de complétion (snake_case - compat)
     * - utile si certains endpoints sérialisent en snake_case
     */
    is_completed?: boolean | null;
    completed_at?: string | null;
};

/**
 * stepIsDone
 * - Helper pur (testable) pour déterminer si une step est complétée.
 * - Priorité: isCompleted (camelCase) puis fallback is_completed (snake_case).
 * - Retourne toujours un boolean strict.
 */
export function stepIsDone(s: Pick<Step, "isCompleted" | "is_completed">): boolean {
    return Boolean((s.isCompleted ?? s.is_completed) ?? false);
}

/**
 * useSteps
 * - Hook qui encapsule tous les appels API liés aux étapes (steps)
 * - Expose loading/error pour l’UI
 * - Fournit des méthodes CRUD + helpers
 */
export function useSteps() {
    /** Indique qu’une requête réseau est en cours (pour disable boutons, afficher loader, etc.) */
    const [loading, setLoading] = useState(false);

    /** Erreur utilisateur-friendly (souvent message backend), sinon fallback */
    const [error, setError] = useState<string | null>(null);

    /**
     * listSteps
     * - GET /goals/:goalId/steps
     * - Récupère toutes les étapes d’un objectif (tri géré côté backend)
     * - En cas d’échec: setError + renvoie []
     */
    const listSteps = useCallback(async (goalId: string | number) => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await api.get(`/goals/${goalId}/steps`);
            // Sécurité: on ne garde que les tableaux
            return Array.isArray(data) ? (data as Step[]) : [];
        } catch (e) {
            // On tente d’afficher le message du backend, sinon message générique
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setError(e?.response?.data?.message ?? "Impossible de charger les étapes.");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * addStep
     * - POST /goals/:goalId/steps
     * - Crée une étape associée à l’objectif goalId
     * - Note: ici on ne set pas loading/error global => c’est l’écran qui gère via try/catch
     */
    const addStep = useCallback(
        async (
            goalId: string | number,
            payload: { title: string; deadline?: string; order?: number }
        ) => {
            const { data } = await api.post(`/goals/${goalId}/steps`, payload);
            return data as Step;
        },
        []
    );

    /**
     * updateStep
     * - PUT /steps/:stepId
     * - Met à jour les champs modifiables (title, deadline, order, is_completed)
     * - is_completed permet le "toggle" (check/uncheck) côté UI
     */
    const updateStep = useCallback(
        async (
            stepId: string | number,
            payload: Partial<{ title: string; deadline?: string; order?: number; is_completed: boolean }>
        ) => {
            const { data } = await api.put(`/steps/${stepId}`, payload);
            return data as Step;
        },
        []
    );

    /**
     * deleteStep
     * - DELETE /steps/:stepId
     * - Supprime une étape
     */
    const deleteStep = useCallback(async (stepId: string | number) => {
        await api.delete(`/steps/${stepId}`);
    }, []);

    /**
     * completeStep
     * - PATCH /steps/:stepId/complete
     * - Endpoint dédié "mark completed"
     * - Si tu utilises uniquement updateStep + is_completed, tu peux supprimer cette fonction.
     */
    const completeStep = useCallback(async (stepId: string | number) => {
        const { data } = await api.patch(`/steps/${stepId}/complete`);
        return data as Step;
    }, []);

    /**
     * isDone
     * - Wrapper callback pour éviter de recalculer la fonction dans les composants
     * - Utilise stepIsDone (helper pur)
     */
    const isDone = useCallback((s: Step) => stepIsDone(s), []);

    /**
     * On expose l’API du hook
     */
    return { loading, error, listSteps, addStep, updateStep, deleteStep, completeStep, isDone };
}
