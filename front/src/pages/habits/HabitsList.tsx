import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useHabits, type Habit } from "../../hooks/useHabits";

function weeklyTarget(h: Habit) {
    return (h.weekly_target ?? h.weeklyTarget ?? null) as number | null;
}

function badgeText(h: Habit) {
    if (h.frequency === "daily") return "Daily";
    return `Weekly • ${weeklyTarget(h) ?? "?"}x`;
}

export default function HabitsList() {
    const navigate = useNavigate();

    // ✅ IMPORTANT: il faut que ton hook expose listArchived()
    const { loading, error, listActive, listArchived, archive } = useHabits();

    const [items, setItems] = useState<Habit[]>([]);
    const [busyId, setBusyId] = useState<number | null>(null);

    // ✅ onglet
    const [tab, setTab] = useState<"active" | "archived">("active");

    async function refresh() {
        const data = tab === "archived" ? await listArchived() : await listActive();
        setItems(data);
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const count = useMemo(() => items.length, [items]);

    async function onArchive(habit: Habit) {
        if (!confirm(`Archiver "${habit.name}" ?`)) return;
        setBusyId(habit.id);
        try {
            await archive(habit.id);
            await refresh();
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="min-h-[100svh] w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-3xl space-y-4">
                {/* Header responsive */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold text-zinc-900">Habitudes</h1>
                        <p className="text-sm text-zinc-600">
                            {tab === "archived"
                                ? "Consulte tes habitudes archivées."
                                : "Gère tes habitudes actives : modifier ou archiver."}
                        </p>
                    </div>

                    <Link to="/habits/new" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">+ Nouvelle habitude</Button>
                    </Link>
                </div>

                {/* Tabs Actives / Archivées */}
                <div className="flex w-full gap-2">
                    <button
                        type="button"
                        onClick={() => setTab("active")}
                        className={[
                            "w-full rounded-xl border px-3 py-2 text-sm font-semibold transition",
                            tab === "active"
                                ? "text-white border-zinc-900  bg-zinc-900"
                                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                        ].join(" ")}
                    >
                        Actives
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab("archived")}
                        className={[
                            "w-full rounded-xl border px-3 py-2 text-sm font-semibold transition",
                            tab === "archived"
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                        ].join(" ")}
                    >
                        Archivées
                    </button>
                </div>

                {/* Error */}
                {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {/* Empty state */}
                {!loading && count === 0 ? (
                    <Card variant="soft">
                        <CardHeader>
                            <CardTitle>
                                {tab === "archived" ? "Aucune habitude archivée" : "Aucune habitude active"}
                            </CardTitle>
                            <CardDescription>
                                {tab === "archived"
                                    ? "Tu n’as rien archivé pour le moment."
                                    : "Crée ta première habitude pour commencer le suivi."}
                            </CardDescription>
                        </CardHeader>

                        {tab === "active" ? (
                            <CardContent>
                                <Link to="/habits/new">
                                    <Button className="w-full">Créer une habitude</Button>
                                </Link>
                            </CardContent>
                        ) : null}
                    </Card>
                ) : null}

                {/* List */}
                {loading ? (
                    <div className="text-sm text-zinc-600">Chargement...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {items.map((h) => (
                            <Card
                                key={h.id}
                                className="cursor-pointer overflow-hidden hover:shadow-md"
                                onClick={() => navigate(`/habits/${h.id}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") navigate(`/habits/${h.id}`);
                                }}
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate">{h.name}</p>
                                            <p className="mt-1 text-sm font-normal text-zinc-600">
                                                {h.category ?? "Sans catégorie"}
                                            </p>
                                        </div>

                                        <span className="shrink-0 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      {badgeText(h)}
                    </span>
                                    </CardTitle>

                                    {h.description ? (
                                        <CardDescription className="line-clamp-2">{h.description}</CardDescription>
                                    ) : (
                                        <CardDescription>—</CardDescription>
                                    )}
                                </CardHeader>

                                {/* Actions responsive */}
                                <CardContent className="flex flex-col gap-2 sm:flex-row">
                                    {/* stopPropagation = ne pas déclencher la navigation */}
                                    <Link
                                        to={`/habits/${h.id}/edit`}
                                        className="w-full"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button variant="secondary" className="w-full">
                                            Modifier
                                        </Button>
                                    </Link>

                                    {/* ✅ Archiver seulement dans l’onglet Actives */}
                                    {tab === "active" ? (
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onArchive(h);
                                            }}
                                            disabled={busyId === h.id}
                                        >
                                            {busyId === h.id ? "Archivage..." : "Archiver"}
                                        </Button>
                                    ) : null}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
