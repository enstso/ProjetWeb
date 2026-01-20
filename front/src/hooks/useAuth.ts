import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

type User = { id: number | string; email: string; fullName?: string };

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const loadMe = useCallback(async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get("/me");
            setUser(data);
        } catch {
            localStorage.removeItem("access_token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMe();
    }, [loadMe]);

    const login = useCallback(async (email: string, password: string) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("access_token", data.access_token.token);
        await loadMe();
    }, [loadMe]);

    const register = useCallback(async (fullName: string, email: string, password: string) => {
        const { data } = await api.post("/auth/register", { fullName, email, password });
        localStorage.setItem("access_token", data.token);
        setUser(data.user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("access_token");
        setUser(null);
    }, []);

    return { user, loading, login, register, logout, reload: loadMe };
}
