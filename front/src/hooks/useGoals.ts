import { useCallback, useMemo, useState } from "react";
import { api } from "../lib/api";

export type Goal = {
    id: number;
    title: string;
    description?: string | null;
    category?: string | null;
    priority: "low" | "medium" | "high";
    status: "active" | "completed" | "abandoned";
    // selon ta sérialisation backend: camelCase ou snake_case
    startDate?: string;
    start_date?: string;
    completedAt?: string | null;
    deadline?: string;
};

function getStartDate(g: any) {
    return g.startDate ?? g.start_date ?? "";
}
function getDeadline(g: any) {
    return g.deadline ?? "";
}

export function useGoals() {
    const [items, setItems] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGoals = useCallback(async (params?: {
        status?: string;
        priority?: string;
        order?: "asc" | "desc";
    }) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get("/goals", { params });
            setItems(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Impossible de charger les objectifs.");
        } finally {
            setLoading(false);
        }
    }, []);

    const getGoal = useCallback(async (id: string | number) => {
        const { data } = await api.get(`/goals/${id}`);
        return data as Goal;
    }, []);

    const createGoal = useCallback(async (payload: {
        title: string;
        description?: string;
        category?: string;
        priority: "low" | "medium" | "high";
        status: "active" | "completed" | "abandoned";
        start_date: string; // YYYY-MM-DD
        deadline: string;   // YYYY-MM-DD
    }) => {
        const { data } = await api.post("/goals", payload);
        return data as Goal;
    }, []);

    const updateGoal = useCallback(async (id: string | number, payload: Partial<{
        title: string;
        description?: string;
        category?: string;
        priority: "low" | "medium" | "high";
        status: "active" | "completed" | "abandoned";
        start_date: string;
        deadline: string;
    }>) => {
        const { data } = await api.put(`/goals/${id}`, payload);
        return data as Goal;
    }, []);

    const deleteGoal = useCallback(async (id: string | number) => {
        await api.delete(`/goals/${id}`);
    }, []);

    const completeGoal = useCallback(async (id: string | number) => {
        const { data } = await api.patch(`/goals/${id}/complete`);
        return data as Goal;
    }, []);

    const helpers = useMemo(() => ({ getStartDate, getDeadline }), []);

    return { items, loading, error, fetchGoals, getGoal, createGoal, updateGoal, deleteGoal, completeGoal, helpers };
}
