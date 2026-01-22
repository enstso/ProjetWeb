import {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {useAuth} from "../hooks/useAuth";
import {Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from "../components/ui/Card";
import {Button} from "../components/ui/Button";
import {DashboardSkeleton} from "../components/dashboard/DashboardSkeleton";
import {useDashboard, type DashboardResponse} from "../hooks/useDashboard";

function formatDateShort(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    return d.toLocaleDateString("fr-FR", {day: "2-digit", month: "short", year: "numeric"});
}

function pillBase() {
    return "inline-flex items-center rounded-xl border px-2 py-1 text-xs font-semibold";
}

function StatCard({label, value, hint}: Readonly<{ label: string; value: string | number; hint?: string }>) {
    return (
        <Card className="h-full">
            <CardContent className="space-y-1">
                <p className="text-xs font-medium text-zinc-600">{label}</p>
                <p className="text-3xl font-semibold tracking-tight text-zinc-900">{value}</p>
                {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const {user} = useAuth();
    const {loading, error, fetchDashboard} = useDashboard();

    const [data, setData] = useState<DashboardResponse | null>(null);

    async function refresh() {
        const d = await fetchDashboard(5);
        if (d) setData(d);
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goals = data?.goals_active.items ?? [];
    const habits = data?.habits_today ?? [];

    const habitsDoneToday = useMemo(
        () => data?.stats?.habits_completed_today ?? 0,
        [data]
    );


    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-5xl space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
                        <p className="text-sm text-zinc-600">
                            Bonjour <span className="font-semibold text-zinc-900">{user?.email}</span>
                            {data ? (
                                <>
                                    {" "}
                                    • <span className="text-zinc-500">Aujourd’hui :</span>{" "}
                                    <span className="font-medium text-zinc-800">{data.today}</span>
                                </>
                            ) : null}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={refresh} disabled={loading}>
                            Rafraîchir
                        </Button>
                    </div>
                </div>

                {/* Error */}
                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {/* Loading */}
                {loading && !data ? <DashboardSkeleton/> : null}

                {/* Content */}
                {!loading && data ? (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <StatCard label="Objectifs complétés" value={data.stats.completed_goals}
                                      hint="Total depuis le début"/>
                            <StatCard label="Streak max" value={data.stats.max_streak}
                                      hint="Meilleure série (toutes habitudes)"/>
                            <StatCard
                                label="Habitudes cochées aujourd’hui"
                                value={`${habitsDoneToday}/${habits.length}`}
                                hint="Aujourd’hui (timezone user)"
                            />
                        </div>

                        {/* Panels */}
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {/* Goals */}
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between gap-3">
                                        <span>Objectifs en cours</span>
                                        <span className={`${pillBase()} border-zinc-200 bg-white text-zinc-700`}>
                      {data.goals_active.total} total
                    </span>
                                    </CardTitle>
                                    <CardDescription>Aperçu des {data.goals_active.limit} prochaines
                                        deadlines.</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-2">
                                    {goals.length === 0 ? (
                                        <p className="text-sm text-zinc-600">Aucun objectif en cours.</p>
                                    ) : (
                                        goals.map((g) => (
                                            <div
                                                key={g.id}
                                                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-zinc-900">{g.title}</p>
                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        Deadline :{" "}
                                                        <span
                                                            className="font-medium text-zinc-700">{formatDateShort(g.deadline ?? null)}</span>
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 flex-col items-end gap-2">
                                                    {g.priority ? (
                                                        <span
                                                            className={`${pillBase()} border-zinc-200 bg-zinc-50 text-zinc-700`}>
                              {g.priority}
                            </span>
                                                    ) : null}
                                                    <Link to={`/goals/${g.id}`}>
                                                        <Button variant="secondary">Détails</Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>

                                <CardFooter className="justify-between">
                                    <Link to="/goals">
                                        <Button variant="secondary">Voir tous</Button>
                                    </Link>
                                    <Link to="/goals/new">
                                        <Button>+ Nouvel objectif</Button>
                                    </Link>
                                </CardFooter>
                            </Card>

                            {/* Habits */}
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between gap-3">
                                        <span>Habitudes du jour</span>
                                        <span
                                            className={`${pillBase()} border-emerald-200 bg-emerald-50 text-emerald-800`}>
                      {habitsDoneToday} validée(s)
                    </span>
                                    </CardTitle>
                                    <CardDescription>Habitudes actives + statut “complétée
                                        aujourd’hui”.</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-2">
                                    {habits.length === 0 ? (
                                        <p className="text-sm text-zinc-600">Aucune habitude active.</p>
                                    ) : (
                                        habits.slice(0, 8).map((h) => (
                                            <div
                                                key={h.id}
                                                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-zinc-900">{h.name}</p>
                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        {h.category ?? "Sans catégorie"} •{" "}
                                                        <span className="font-medium text-zinc-700">
                              {h.frequency === "daily"
                                  ? "Daily"
                                  : `Weekly ${(h.weekly_target ?? h.weeklyTarget ?? "?") as any}x`}
                            </span>
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                          <span
                              className={[
                                  pillBase(),
                                  h.completed_today
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : "border-zinc-200 bg-zinc-50 text-zinc-700",
                              ].join(" ")}
                          >
                            {h.completed_today ? "OK" : "À faire"}
                          </span>

                                                    <Link to={`/habits/${h.id}`}>
                                                        <Button variant="secondary">Voir</Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>

                                <CardFooter className="justify-between">
                                    <Link to="/habits">
                                        <Button variant="secondary">Gérer habitudes</Button>
                                    </Link>
                                    <Link to="/habits/new">
                                        <Button>+ Nouvelle habitude</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
