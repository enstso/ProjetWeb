import { useCallback, useState } from "react";
import { api } from "../lib/api";

export type Habit = {
    id: number;
    name: string;
    description?: string | null;
    category?: string | null;
    frequency: "daily" | "weekly";
    weeklyTarget?: number | null;
    weekly_target?: number | null;
    startDate?: string;
    start_date?: string;
    isArchived?: boolean;
    is_archived?: boolean;
};

export function useHabits() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const listActive = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const { data } = await api.get("/habits");
            return Array.isArray(data) ? (data as Habit[]) : [];
        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Impossible de charger les habitudes.");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getOne = useCallback(async (id: string | number) => {
        const { data } = await api.get(`/habits/${id}`);
        return data as Habit;
    }, []);

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

    const update = useCallback(async (id: string | number, payload: any) => {
        const { data } = await api.put(`/habits/${id}`, payload);
        return data as Habit;
    }, []);

    const archive = useCallback(async (id: string | number) => {
        const { data } = await api.patch(`/habits/${id}/archive`);
        return data as Habit;
    }, []);

    const checkToday = useCallback(async (habitId: string | number) => {
        const { data } = await api.post(`/habits/${habitId}/log`);
        return data as { id: number; date_iso: string; already_exists: boolean };
    }, []);

    const uncheck = useCallback(async (habitId: string | number, dateISO: string) => {
        await api.delete(`/habits/${habitId}/log/${dateISO}`);
    }, []);


    return { loading, error, listActive, getOne, create, update, archive,checkToday,uncheck };
}
