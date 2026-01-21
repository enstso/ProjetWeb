import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useHabits, type Habit } from "../../hooks/useHabits";

export default function HabitsList() {
    const { loading, error, listActive, archive } = useHabits();
    const [items, setItems] = useState<Habit[]>([]);

    async function refresh() {
        const data = await listActive();
        setItems(data);
    }

    useEffect(() => { refresh(); }, []);

    async function onArchive(id: number) {
        if (!confirm("Archiver cette habitude ?")) return;
        await archive(id);
        await refresh();
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-3xl space-y-4">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900">Habitudes</h1>
                        <p className="text-sm text-zinc-600">Liste des habitudes actives + archive.</p>
                    </div>
                    <Link to="/habits/new"><Button>+ Nouvelle habitude</Button></Link>
                </div>

                {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : null}

                {loading ? (
                    <div className="text-sm text-zinc-600">Chargement...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {items.map((h) => (
                            <Card key={h.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between gap-3">
                                        <span className="truncate">{h.name}</span>
                                        <span className="rounded-xl border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700">
                      {h.frequency === "daily" ? "Daily" : `Weekly ${h.weekly_target ?? h.weeklyTarget ?? ""}`}
                    </span>
                                    </CardTitle>
                                    <CardDescription>{h.category ?? "Sans catégorie"}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Link to={`/habits/${h.id}/edit`} className="w-full">
                                        <Button variant="secondary" className="w-full">Modifier</Button>
                                    </Link>
                                    <Button variant="secondary" className="w-full" onClick={() => onArchive(h.id)}>
                                        Archiver
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        {items.length === 0 ? <p className="text-sm text-zinc-600">Aucune habitude active.</p> : null}
                    </div>
                )}
            </div>
        </div>
    );
}
