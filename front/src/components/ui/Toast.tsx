import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Types de toast supportés par le composant.
 * - success : action réussie (feedback positif)
 * - error   : erreur bloquante ou échec d’une action
 * - info    : message informatif (ex: action annulée/décochée)
 */
type ToastType = "success" | "error" | "info";

/**
 * Structure interne d’un toast dans la file d’affichage.
 * - id : identifiant unique (permet de retirer le toast)
 * - type : style/couleur + intention (success/error/info)
 * - title : titre optionnel (souvent court)
 * - message : contenu principal (obligatoire)
 */
type ToastItem = {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
};

/**
 * Valeur exposée par le contexte.
 * push() ajoute un toast à l’écran et le retire automatiquement après durationMs.
 */
type ToastContextValue = {
    push: (t: Omit<ToastItem, "id">, durationMs?: number) => void;
};

/**
 * Contexte React pour rendre le système de toast accessible
 * depuis n’importe quel composant enfant via useToast().
 */
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Génère un ID simple (non cryptographique) pour identifier un toast.
 * Suffisant pour un usage UI (évite collisions dans la majorité des cas).
 */
function uid() {
    return Math.random().toString(36).slice(2, 10);
}

/**
 * Classe Tailwind de base (container du toast) selon le type.
 * - common : layout / border / shadow / padding / transition
 * - puis on ajuste la couleur de la bordure pour indiquer l’intention.
 */
function baseStyle(type: ToastType) {
    const common =
        "pointer-events-auto w-full max-w-sm rounded-2xl border bg-white shadow-lg px-4 py-3 transition";
    if (type === "success") return `${common} border-emerald-200`;
    if (type === "error") return `${common} border-red-200`;
    return `${common} border-zinc-200`;
}

/**
 * Petite pastille (dot) colorée à gauche du toast pour renforcer le type.
 */
function dotStyle(type: ToastType) {
    const common = "h-2.5 w-2.5 rounded-full";
    if (type === "success") return `${common} bg-emerald-500`;
    if (type === "error") return `${common} bg-red-500`;
    return `${common} bg-zinc-500`;
}

/**
 * Provider : stocke la liste des toasts et affiche le container en position fixe.
 * À placer haut dans l’arbre (ex: AppLayout) pour couvrir toute l’app.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    /**
     * Liste des toasts affichés. On garde un maximum (ici 3).
     */
    const [items, setItems] = useState<ToastItem[]>([]);

    /**
     * push() : ajoute un toast, limite à 3, et programme sa suppression.
     * - durationMs par défaut: 2600ms (UX: court mais lisible)
     * - setTimeout pour auto-dismiss
     */
    const push = useCallback((t: Omit<ToastItem, "id">, durationMs = 2600) => {
        const id = uid();
        const toast: ToastItem = { id, ...t };

        // On ajoute en haut (le plus récent en premier) et on limite à 3 toasts visibles.
        setItems((prev) => [toast, ...prev].slice(0, 3));

        // Auto-suppression après durationMs.
        window.setTimeout(() => {
            setItems((prev) => prev.filter((x) => x.id !== id));
        }, durationMs);
    }, []);

    /**
     * Valeur memoïzée pour éviter des re-renders inutiles des consumers du contexte.
     */
    const value = useMemo(() => ({ push }), [push]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/*
              Container global des toasts :
              - fixed top/right : toujours visible
              - pointer-events-none : ne bloque pas les clics derrière
              - w min(92vw, 420px) : responsive mobile/desktop
              - z-50 : au-dessus du reste
            */}
            <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,420px)] flex-col gap-2">
                {items.map((t) => (
                    // Chaque toast est pointer-events-auto pour rester cliquable si besoin (plus tard).
                    <div key={t.id} className={baseStyle(t.type)}>
                        <div className="flex items-start gap-3">
                            {/* Pastille de couleur indicative */}
                            <span className={dotStyle(t.type)} />
                            <div className="min-w-0">
                                {/* Titre optionnel (si fourni) */}
                                {t.title ? (
                                    <p className="text-sm font-semibold text-zinc-900">{t.title}</p>
                                ) : null}

                                {/* Message principal */}
                                <p className="text-sm text-zinc-700">{t.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/**
 * Hook pour consommer le contexte.
 * Force l’utilisation à l’intérieur du <ToastProvider />.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
    return ctx;
}
