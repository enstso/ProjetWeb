import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useHabits, type Habit } from "../../hooks/useHabits";
import { HabitTrackingGrid } from "../../components/habits/HabitTrackingGrid";

/**
 * Récupère la cible hebdo (weekly_target) en tolérant les deux formats :
 * - snake_case (weekly_target) : souvent côté API
 * - camelCase (weeklyTarget)   : parfois côté front
 */
function getWeeklyTarget(h: Habit) {
    return (h.weekly_target ?? h.weeklyTarget ?? null);
}

/**
 * Récupère la date de début en tolérant les deux formats :
 * - snake_case (start_date)
 * - camelCase (startDate)
 */
function getStartDate(h: Habit) {
    return (h.start_date ?? h.startDate ?? "—");
}

/**
 * Page HabitDetail
 * - Affiche les infos d'une habitude (nom, catégorie, fréquence, dates)
 * - Affiche les stats (streak actuel, meilleur streak, taux)
 * - Permet de check/uncheck aujourd’hui (surtout pour daily)
 * - Permet d’archiver une habitude
 * - Affiche l’historique via une grille mensuelle (HabitTrackingGrid)
 *
 * Note métier : une habitude archivée reste consultable, mais le suivi est désactivé (check/uncheck).
 */
export default function HabitDetail() {
    /**
     * id vient des params de route (/habits/:id)
     */
    const { id } = useParams();

    /**
     * navigate pour redirections (retour liste après archive par ex.)
     */
    const nav = useNavigate();

    /**
     * API habits :
     * - getOne : récupérer l’habitude
     * - getStats : récupérer stats agrégées
     * - archive : archiver l’habitude
     * - checkToday/uncheck : créer/supprimer un log sur "aujourd'hui"
     */
    const { getOne, getStats, archive, checkToday, uncheck } = useHabits();

    /**
     * habit : objet métier principal affiché
     */
    const [habit, setHabit] = useState<Habit | null>(null);

    /**
     * stats : bloc d’info calculées côté back
     * - today : ISO day (selon timezone user)
     * - current/best : streaks
     * - rate : completion rate %
     */
    const [stats, setStats] = useState<{
        today: string;
        current: number;
        best: number;
        rate: number;
    } | null>(null);

    /**
     * États UI généraux : chargement + erreur
     */
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    /**
     * todayCheckedISO :
     * - null => "aujourd’hui" est non coché (pas de log détecté)
     * - string (YYYY-MM-DD) => log présent pour aujourd’hui
     *
     * busyToday : évite les double-clics pendant une action check/uncheck
     */
    const [todayCheckedISO, setTodayCheckedISO] = useState<string | null>(null);
    const [busyToday, setBusyToday] = useState(false);

    /**
     * Détermine si l’habitude est archivée.
     * - Utilise optional chaining car habit peut être null au début.
     * - Tolère snake_case / camelCase.
     */
    const isArchived = !!(habit?.is_archived ?? habit?.isArchived);

    /**
     * Label de fréquence :
     * - daily => "Quotidienne"
     * - weekly => "Hebdomadaire • Xx/semaine"
     */
    const freqLabel = useMemo(() => {
        if (!habit) return "";
        if (habit.frequency === "daily") return "Quotidienne";
        const wt = getWeeklyTarget(habit);
        return `Hebdomadaire • ${wt ?? "?"}x/semaine`;
    }, [habit]);

    /**
     * refresh :
     * - charge l’habitude (getOne)
     * - charge les stats (getStats)
     * - met à jour todayCheckedISO pour daily (approx UX : streak>0 => today coché)
     *
     * Remarque : le backend renvoie "today" basé sur X-Timezone, donc la cohérence
     * check/uncheck dépend du même "today" côté back.
     */
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

            // UX : daily => on considère today coché si current_streak > 0
            // (weekly : pas applicable, streak dépend des semaines)
            if (h.frequency === "daily") {
                setTodayCheckedISO(s.stats.current_streak > 0 ? s.today : null);
            } else {
                setTodayCheckedISO(null);
            }
        } catch (e) {
            // on remonte un message d’erreur backend si disponible
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Impossible de charger l’habitude.");
        } finally {
            setLoading(false);
        }
    }

    /**
     * Chargement initial + quand l’id change
     */
    useEffect(() => {
        refresh().then();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    /**
     * Archive :
     * - confirmation
     * - appel API PATCH /habits/:id/archive
     * - redirection vers la liste
     */
    async function onArchive() {
        if (!habit) return;
        if (!confirm("Archiver cette habitude ?")) return;
        try {
            await archive(habit.id);
            nav("/habits");
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Impossible d’archiver.");
        }
    }

    /**
     * Toggle check/uncheck "aujourd’hui"
     * Règle métier côté UI :
     * - Si archivée => on bloque pour éviter de créer/supprimer des logs
     *   (la sécurité finale doit aussi être côté backend).
     *
     * Après action, on refresh pour resynchroniser stats + état.
     */
    async function onToggleToday() {
        if (!habit) return;

        // bloque si archivé (UX + logique métier)
        if (isArchived) {
            setErr("Habitude archivée : le suivi (check/uncheck) est désactivé.");
            return;
        }

        setBusyToday(true);
        setErr(null);

        try {
            // si non coché => on crée un log (idempotent côté back si déjà existe)
            if (!todayCheckedISO) {
                const res = await checkToday(habit.id);
                setTodayCheckedISO(res.date_iso);
            } else {
                // si coché => on supprime le log du jour
                await uncheck(habit.id, todayCheckedISO);
                setTodayCheckedISO(null);
            }

            // resync : stats + todayCheckedISO recalculé
            await refresh();
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Action impossible.");
        } finally {
            setBusyToday(false);
        }
    }

    /**
     * États de rendu
     */
    if (loading) return <div className="p-6 text-sm text-zinc-600">Chargement...</div>;
    if (err) return <div className="p-6 text-sm text-red-700">{err}</div>;
    if (!habit) return null;

    return (
        <div className="min-h-[100svh] w-full bg-gradient-to-b from-zinc-50 to-white px-4 py-4">
            <div className="mx-auto w-full max-w-3xl space-y-4">
                <Card className="overflow-hidden">
                    {/* Header (responsive) : nom + badges (archivé + fréquence) + méta */}
                    <CardHeader className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <CardTitle className="min-w-0 text-xl sm:text-2xl">
                                <span className="block truncate">{habit.name}</span>
                            </CardTitle>

                            <div className="flex items-center gap-2">
                                {/* Badge archivé (si applicable) */}
                                {isArchived ? (
                                    <span className="w-fit rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                                        Archivée
                                    </span>
                                ) : null}

                                {/* Badge fréquence */}
                                <span className="w-fit rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                                    {freqLabel}
                                </span>
                            </div>
                        </div>

                        {/* Catégorie + date de début */}
                        <CardDescription className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                            <span className="truncate">{habit.category ?? "Sans catégorie"}</span>
                            <span className="hidden text-zinc-300 sm:inline">•</span>
                            <span>Début : {getStartDate(habit)}</span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Bandeau d'info si archivé : stats/historique OK, actions KO */}
                        {isArchived ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                Cette habitude est archivée : tu peux consulter l’historique et les stats, mais tu ne
                                peux plus cocher/décocher.
                            </div>
                        ) : null}

                        {/* Stats cards */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Streak actuel</p>
                                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                                    {stats?.current ?? 0}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Meilleur streak</p>
                                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                                    {stats?.best ?? 0}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Taux</p>
                                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                                    {stats?.rate ?? 0}%
                                </p>
                            </div>
                        </div>

                        {/* Progress (completion rate) + today (timezone) */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <ProgressBar value={stats?.rate ?? 0} />
                            <p className="mt-2 text-xs text-zinc-500">
                                Aujourd’hui (timezone) :{" "}
                                <span className="font-medium text-zinc-800">{stats?.today ?? "—"}</span>
                            </p>
                        </div>

                        {/* Actions principales (check/uncheck + retour) */}
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                                className="w-full sm:w-auto sm:flex-1"
                                onClick={onToggleToday}
                                disabled={busyToday || isArchived}
                            >
                                {isArchived
                                    ? "Suivi désactivé (archivée)"
                                    : busyToday
                                        ? "En cours..."
                                        : todayCheckedISO
                                            ? "Décocher aujourd’hui"
                                            : "Check aujourd’hui"}
                            </Button>

                            <Link className="w-full sm:w-auto sm:flex-1" to="/habits">
                                <Button variant="secondary" className="w-full">
                                    Retour liste
                                </Button>
                            </Link>
                        </div>

                        {/* Historique : reste consultable même si archivée */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <p className="mb-3 text-sm font-semibold text-zinc-900">Historique</p>
                            <HabitTrackingGrid habitId={habit.id} />
                        </div>
                    </CardContent>

                    {/* Footer : edit + archive (désactivé si déjà archivée) */}
                    <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Link className="w-full sm:w-auto" to={`/habits/${habit.id}/edit`}>
                                <Button variant="secondary" className="w-full sm:w-auto">
                                    Modifier
                                </Button>
                            </Link>

                            <Button
                                variant="secondary"
                                className="w-full sm:w-auto"
                                onClick={onArchive}
                                disabled={isArchived}
                            >
                                {isArchived ? "Déjà archivée" : "Archiver"}
                            </Button>
                        </div>

                        {/* Petit texte d’aide (non bloquant) */}
                        <div className="w-full text-xs text-zinc-500 sm:w-auto sm:text-right">
                            Astuce : coche régulièrement pour garder ton streak ✨
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
