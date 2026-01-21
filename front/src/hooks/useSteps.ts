import { useCallback, useState } from "react";
import { api } from "../lib/api";

export type Step = {
    id: number;
    title: string;
    deadline?: string | null;
    isCompleted?: boolean;
    is_completed?: boolean;
    order?: number;
};

function isDone(s: any) {
    return s.isCompleted ?? s.is_completed ?? false;
}

export function useSteps() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const listSteps = useCallback(async (goalId: string | number) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get(`/goals/${goalId}/steps`);
            return Array.isArray(data) ? (data as Step[]) : [];
        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Impossible de charger les étapes.");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const addStep = useCallback(async (goalId: string | number, payload: { title: string; deadline?: string; order?: number }) => {
        const { data } = await api.post(`/goals/${goalId}/steps`, payload);
        return data as Step;
    }, []);

    const updateStep = useCallback(async (stepId: string | number, payload: Partial<{ title: string; deadline?: string; order?: number }>) => {
        const { data } = await api.put(`/steps/${stepId}`, payload);
        return data as Step;
    }, []);

    const deleteStep = useCallback(async (stepId: string | number) => {
        await api.delete(`/steps/${stepId}`);
    }, []);

    const completeStep = useCallback(async (stepId: string | number) => {
        const { data } = await api.patch(`/steps/${stepId}/complete`);
        return data as Step;
    }, []);

    return { loading, error, listSteps, addStep, updateStep, deleteStep, completeStep, isDone };
}
