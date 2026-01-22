import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
};

type ToastContextValue = {
    push: (t: Omit<ToastItem, "id">, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

function baseStyle(type: ToastType) {
    const common =
        "pointer-events-auto w-full max-w-sm rounded-2xl border bg-white shadow-lg px-4 py-3 transition";
    if (type === "success") return `${common} border-emerald-200`;
    if (type === "error") return `${common} border-red-200`;
    return `${common} border-zinc-200`;
}

function dotStyle(type: ToastType) {
    const common = "h-2.5 w-2.5 rounded-full";
    if (type === "success") return `${common} bg-emerald-500`;
    if (type === "error") return `${common} bg-red-500`;
    return `${common} bg-zinc-500`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const push = useCallback((t: Omit<ToastItem, "id">, durationMs = 2600) => {
        const id = uid();
        const toast: ToastItem = { id, ...t };
        setItems((prev) => [toast, ...prev].slice(0, 3)); // max 3
        window.setTimeout(() => {
            setItems((prev) => prev.filter((x) => x.id !== id));
        }, durationMs);
    }, []);

    const value = useMemo(() => ({ push }), [push]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* container */}
            <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,420px)] flex-col gap-2">
                {items.map((t) => (
                    <div key={t.id} className={baseStyle(t.type)}>
                        <div className="flex items-start gap-3">
                            <span className={dotStyle(t.type)} />
                            <div className="min-w-0">
                                {t.title ? (
                                    <p className="text-sm font-semibold text-zinc-900">{t.title}</p>
                                ) : null}
                                <p className="text-sm text-zinc-700">{t.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
    return ctx;
}
