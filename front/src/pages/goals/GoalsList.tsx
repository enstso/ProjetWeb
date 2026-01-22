import {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "../../components/ui/Card";
import {Button} from "../../components/ui/Button";
import {Select} from "../../components/ui/Select";
import {useGoals} from "../../hooks/useGoals";

export default function GoalsList() {
    const {items, loading, error, fetchGoals, helpers} = useGoals();

    const [status, setStatus] = useState<string>("");
    const [priority, setPriority] = useState<string>("");
    const [order, setOrder] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        fetchGoals({
            status: status || undefined,
            priority: priority || undefined,
            order,
        });
    }, [status, priority, order, fetchGoals]);

    const count = useMemo(() => items.length, [items]);

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-3xl space-y-4">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900">Objectifs</h1>
                        <p className="text-sm text-zinc-600">Gère tes objectifs et respecte tes deadlines.</p>
                    </div>
                    <Link to="/goals/new">
                        <Button>+ Nouvel objectif</Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filtres & tri</CardTitle>
                        <CardDescription>{count} objectif(s)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <Select label="Statut" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">Tous</option>
                                <option value="active">En cours</option>
                                <option value="completed">Complété</option>
                                <option value="abandoned">Abandonné</option>
                            </Select>

                            <Select label="Priorité" value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="">Toutes</option>
                                <option value="low">Basse</option>
                                <option value="medium">Moyenne</option>
                                <option value="high">Haute</option>
                            </Select>

                            <Select label="Trier par deadline" value={order}
                                    onChange={(e) => setOrder(e.target.value as never)}>
                                <option value="asc">La plus proche</option>
                                <option value="desc">La plus lointaine</option>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {error ? (
                    <div
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : null}

                {loading ? (
                    <div className="text-sm text-zinc-600">Chargement...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {items.map((g) => (
                            <Link key={g.id} to={`/goals/${g.id}`}>
                                <Card className="hover:shadow-md">
                                    <CardContent className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm text-zinc-500">
                                                {g.status.toUpperCase()} • {g.priority.toUpperCase()} • {g.category ?? "Sans catégorie"}
                                            </p>
                                            <p className="mt-1 text-lg font-semibold text-zinc-900 truncate">{g.title}</p>
                                            <p className="mt-1 text-sm text-zinc-600">
                                                Start: <span
                                                className="font-medium">{helpers.getStartDate(g) || "—"}</span> •
                                                Deadline:{" "}
                                                <span className="font-medium">{helpers.getDeadline(g) || "—"}</span>
                                            </p>
                                        </div>
                                        <span
                                            className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700">
                      Voir
                    </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                        {items.length === 0 ? (
                            <div className="text-sm text-zinc-600">Aucun objectif pour ce filtre.</div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
