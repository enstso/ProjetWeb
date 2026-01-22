import {useEffect, useMemo, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from "../../components/ui/Card";
import {Button} from "../../components/ui/Button";
import {ProgressBar} from "../../components/ui/ProgressBar";
import {useHabits, type Habit} from "../../hooks/useHabits";
import {HabitTrackingGrid} from "../../components/habits/HabitTrackingGrid";

function getWeeklyTarget(h: Habit) {
    return (h.weekly_target ?? h.weeklyTarget ?? null) as number | null;
}

function getStartDate(h: Habit) {
    return (h.start_date ?? h.startDate ?? "—") as string;
}

export default function HabitDetail() {
    const {id} = useParams();
    const nav = useNavigate();
    const {getOne, getStats, archive, checkToday, uncheck} = useHabits();

    const [habit, setHabit] = useState<Habit | null>(null);
    const [stats, setStats] = useState<{
        today: string;
        current: number;
        best: number;
        rate: number;
    } | null>(null);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // pour gérer check/uncheck today côté UI
    const [todayCheckedISO, setTodayCheckedISO] = useState<string | null>(null);
    const [busyToday, setBusyToday] = useState(false);

    const freqLabel = useMemo(() => {
        if (!habit) return "";
        if (habit.frequency === "daily") return "Quotidienne";
        const wt = getWeeklyTarget(habit);
        return `Hebdomadaire • ${wt ?? "?"}x/semaine`;
    }, [habit]);

    async function refresh() {
        if (!id) return;
        setLoading(true);
        setErr(null);
        try {
            const h = await getOne(id);
            setHabit(h);

            const s = await getStats(id);
            setStats({
                today: s.today,
                current: s.stats.current_streak,
                best: s.stats.best_streak,
                rate: s.stats.completion_rate_percent,
            });

            // UX simple: si current_streak > 0 (daily) on considère check today
            // (Pour weekly c’est plus complexe; tu peux enlever cette ligne si tu préfères)
            if (h.frequency === "daily") {
                setTodayCheckedISO(s.stats.current_streak > 0 ? s.today : null);
            } else {
                setTodayCheckedISO(null);
            }
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Impossible de charger l’habitude.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh().then();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function onArchive() {
        if (!habit) return;
        if (!confirm("Archiver cette habitude ?")) return;
        try {
            await archive(habit.id);
            nav("/habits");
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Impossible d’archiver.");
        }
    }

    async function onToggleToday() {
        if (!habit) return;
        setBusyToday(true);
        setErr(null);

        try {
            if (!todayCheckedISO) {
                const res = await checkToday(habit.id);
                setTodayCheckedISO(res.date_iso);
            } else {
                await uncheck(habit.id, todayCheckedISO);
                setTodayCheckedISO(null);
            }
            // refresh stats après action
            await refresh();
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Action impossible.");
        } finally {
            setBusyToday(false);
        }
    }

    if (loading) return <div className="p-6 text-sm text-zinc-600">Chargement...</div>;
    if (err) return <div className="p-6 text-sm text-red-700">{err}</div>;
    if (!habit) return null;

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-2xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-start justify-between gap-3">
                            <span className="truncate">{habit.name}</span>
                            <span
                                className="shrink-0 rounded-xl border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700">
                {freqLabel}
              </span>
                        </CardTitle>
                        <CardDescription>
                            {habit.category ?? "Sans catégorie"} • Début : {getStartDate(habit)}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Streak actuel</p>
                                <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats?.current ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Meilleur streak</p>
                                <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats?.best ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Taux de complétion</p>
                                <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats?.rate ?? 0}%</p>
                            </div>
                        </div>

                        {/* Progress bar (taux) */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <ProgressBar value={stats?.rate ?? 0}/>
                            <p className="mt-2 text-xs text-zinc-500">
                                Aujourd’hui (timezone) : <span
                                className="font-medium text-zinc-800">{stats?.today ?? "—"}</span>
                            </p>
                        </div>

                        {/* Check/Uncheck today (surtout pertinent pour daily) */}
                        <Button className="w-full" onClick={onToggleToday} disabled={busyToday}>
                            {busyToday
                                ? "En cours..."
                                : todayCheckedISO
                                    ? "Décocher aujourd’hui"
                                    : "Check aujourd’hui"}
                        </Button>
                    </CardContent>
                    <HabitTrackingGrid habitId={habit.id}/>

                    <CardFooter className="justify-between flex-wrap gap-2">
                        <Link to="/habits">
                            <Button variant="secondary">Retour liste</Button>
                        </Link>

                        <div className="flex gap-2">
                            <Link to={`/habits/${habit.id}/edit`}>
                                <Button variant="secondary">Modifier</Button>
                            </Link>
                            <Button variant="secondary" onClick={onArchive}>
                                Archiver
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
