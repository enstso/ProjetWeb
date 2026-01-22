import { useCallback, useState } from "react";
import { api } from "../lib/api";

export type DashboardGoal = {
    id: number;
    title: string;
    status: "active" | "completed" | "abandoned";
    priority?: "low" | "medium" | "high";
    deadline?: string | null;
};

export type DashboardHabit = {
    id: number;
    name: string;
    category?: string | null;
    frequency: "daily" | "weekly";
    weeklyTarget?: number | null;
    weekly_target?: number | null;
    completed_today: boolean;
};

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async (goalLimit = 5) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get<DashboardResponse>("/dashboard", {
                params: { goal_limit: goalLimit },
            });
            return data;
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setError(e?.response?.data?.message ?? "Impossible de charger le dashboard.");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, fetchDashboard };
}
