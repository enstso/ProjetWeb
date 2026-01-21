import {useEffect, useMemo, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "../../components/ui/Card";
import {Button} from "../../components/ui/Button";
import {useHabits, type Habit} from "../../hooks/useHabits";

function weeklyTarget(h: Habit) {
    return (h.weekly_target ?? h.weeklyTarget ?? null) as number | null;
}

function badgeText(h: Habit) {
    if (h.frequency === "daily") return "Daily";
    return `Weekly • ${weeklyTarget(h) ?? "?"}x`;
}

export default function HabitsList() {
    const navigate = useNavigate();
    const {loading, error, listActive, archive} = useHabits();
    const [items, setItems] = useState<Habit[]>([]);
    const [busyId, setBusyId] = useState<number | null>(null);

    async function refresh() {
        const data = await listActive();
        setItems(data);
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-3xl space-y-4">
                {/* Header */}
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900">Habitudes</h1>
                        <p className="text-sm text-zinc-600">Gère tes habitudes actives : modifier ou archiver.</p>
                    </div>
                    <Link to="/habits/new">
                        <Button>+ Nouvelle habitude</Button>
                    </Link>
                </div>

                {/* Error */}
                {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {/* Empty */}
                {!loading && count === 0 ? (
                    <Card variant="soft">
                        <CardHeader>
                            <CardTitle>Aucune habitude active</CardTitle>
                            <CardDescription>Crée ta première habitude pour commencer le suivi.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link to="/habits/new">
                                <Button className="w-full">Créer une habitude</Button>
                            </Link>
                        </CardContent>
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
                                className="overflow-hidden cursor-pointer hover:shadow-md"
                                onClick={() => navigate(`/habits/${h.id}`)} // ✅ clique => HabitDetail
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

                                        <span
                                            className="shrink-0 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      {badgeText(h)}
                    </span>
                                    </CardTitle>

                                    {h.description ? (
                                        <CardDescription className="line-clamp-2">{h.description}</CardDescription>
                                    ) : (
                                        <CardDescription>—</CardDescription>
                                    )}
                                </CardHeader>

                                <CardContent className="flex flex-col gap-2 md:flex-row">
                                    {/* ✅ Stop propagation pour ne pas déclencher la navigation */}
                                    <Link
                                        to={`/habits/${h.id}/edit`}
                                        className="w-full"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button variant="secondary" className="w-full">
                                            Modifier
                                        </Button>
                                    </Link>

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
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
