import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { useDashboard, type DashboardResponse } from "../hooks/useDashboard";

/**
 * Formatte une date courte à partir d’une chaîne ISO.
 * - Si iso est null/undefined => "—"
 * - Si new Date(iso) échoue => fallback sur les 10 premiers chars (YYYY-MM-DD)
 * - Sinon => format FR (jour/mois/année) en version courte
 */
function formatDateShort(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Classes Tailwind communes pour les "pills" (petits badges).
 * On centralise ici pour éviter de dupliquer la même string dans tout le composant.
 */
function pillBase() {
    return "inline-flex items-center rounded-xl border px-2 py-1 text-xs font-semibold";
}

/**
 * Petit composant réutilisable pour afficher une statistique dans une Card.
 * - label : libellé (texte petit)
 * - value : valeur principale (grand texte)
 * - hint : sous-texte optionnel (explication)
 */
function StatCard({ label, value, hint }: Readonly<{ label: string; value: string | number; hint?: string }>) {
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

/**
 * Page Dashboard
 * Objectif :
 * - Afficher des stats globales (objectifs complétés, streak max, habitudes validées aujourd’hui)
 * - Afficher un aperçu des objectifs actifs (prochaines deadlines)
 * - Afficher les habitudes du jour (actives + statut completed_today)
 *
 * Données :
 * - user : via useAuth() (info affichée dans le header)
 * - data : via useDashboard().fetchDashboard()
 */
export default function Dashboard() {
    /**
     * useAuth : récupère l’utilisateur connecté (ici utilisé pour afficher l’email).
     */
    const { user } = useAuth();

    /**
     * useDashboard :
     * - loading : état de chargement réseau
     * - error : message d’erreur (si fetch échoue)
     * - fetchDashboard(limit) : récupère les données du dashboard depuis l’API
     */
    const { loading, error, fetchDashboard } = useDashboard();

    /**
     * data : réponse complète du dashboard.
     * On la met en state pour :
     * - l’afficher
     * - éviter un écran vide lors de refresh (on garde l’ancienne data si besoin)
     */
    const [data, setData] = useState<DashboardResponse | null>(null);

    /**
     * refresh :
     * - appelle l’API avec un limit (ici 5 objectifs)
     * - si on reçoit une réponse valide => setData
     */
    async function refresh() {
        const d = await fetchDashboard(5);
        if (d) setData(d);
    }

    /**
     * Chargement initial du dashboard au montage du composant.
     */
    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Extraction pratique :
     * - goals = liste d’objectifs actifs (preview)
     * - habits = liste d’habitudes du jour
     * On fallback sur [] si data n’est pas encore chargée.
     */
    const goals = data?.goals_active.items ?? [];
    const habits = data?.habits_today ?? [];

    /**
     * habitsDoneToday :
     * - nombre d’habitudes cochées aujourd’hui (calcul serveur dans stats)
     * useMemo ici est optionnel, mais permet de ne pas recalculer si data ne change pas.
     */
    const habitsDoneToday = useMemo(() => data?.stats?.habits_completed_today ?? 0, [data]);

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-5xl space-y-4">
                {/* Header (responsive) : titre + greeting + bouton refresh */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>

                        {/* Ligne "Bonjour ..." + date du jour côté API */}
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

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={refresh} disabled={loading}>
                            Rafraîchir
                        </Button>
                    </div>
                </div>

                {/* Bloc d’erreur API */}
                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {/* Skeleton uniquement quand on charge et qu’on n’a pas encore de data */}
                {loading && !data ? <DashboardSkeleton /> : null}

                {/* Contenu principal : affiché quand on a des données et qu’on n’est pas en chargement initial */}
                {!loading && data ? (
                    <>
                        {/* Stats cards : 1 colonne mobile, puis 2, puis 3 */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <StatCard
                                label="Objectifs complétés"
                                value={data.stats.completed_goals}
                                hint="Total depuis le début"
                            />
                            <StatCard
                                label="Streak max"
                                value={data.stats.max_streak}
                                hint="Meilleure série (toutes habitudes)"
                            />
                            <StatCard
                                label="Habitudes cochées aujourd’hui"
                                value={`${habitsDoneToday}/${habits.length}`}
                                hint="Aujourd’hui (timezone user)"
                            />
                        </div>

                        {/* Panels : une colonne en mobile, deux colonnes à partir de lg */}
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {/* Panel Objectifs */}
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between gap-3">
                                        <span>Objectifs en cours</span>

                                        {/* Badge total objectifs actifs */}
                                        <span className={`${pillBase()} border-zinc-200 bg-white text-zinc-700`}>
                                            {data.goals_active.total} total
                                        </span>
                                    </CardTitle>

                                    {/* Description : rappelle le limit */}
                                    <CardDescription>
                                        Aperçu des {data.goals_active.limit} prochaines deadlines.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-2">
                                    {/* Empty state goals */}
                                    {goals.length === 0 ? (
                                        <p className="text-sm text-zinc-600">Aucun objectif en cours.</p>
                                    ) : (
                                        goals.map((g) => (
                                            <div
                                                key={g.id}
                                                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
                                            >
                                                {/* Texte principal */}
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-zinc-900">{g.title}</p>
                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        Deadline :{" "}
                                                        <span className="font-medium text-zinc-700">
                                                            {formatDateShort(g.deadline ?? null)}
                                                        </span>
                                                    </p>
                                                </div>

                                                {/* Colonne actions/badges */}
                                                <div className="flex shrink-0 flex-col items-end gap-2">
                                                    {g.priority ? (
                                                        <span className={`${pillBase()} border-zinc-200 bg-zinc-50 text-zinc-700`}>
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

                            {/* Panel Habitudes */}
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between gap-3">
                                        <span>Habitudes du jour</span>

                                        {/* Badge "validées" basé sur stats serveur */}
                                        <span className={`${pillBase()} border-emerald-200 bg-emerald-50 text-emerald-800`}>
                                            {habitsDoneToday} validée(s)
                                        </span>
                                    </CardTitle>

                                    <CardDescription>
                                        Habitudes actives + statut “complétée aujourd’hui”.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-2">
                                    {/* Empty state habits */}
                                    {habits.length === 0 ? (
                                        <p className="text-sm text-zinc-600">Aucune habitude active.</p>
                                    ) : (
                                        /**
                                         * On limite à 8 items pour éviter un panel trop long,
                                         * et garder le dashboard compact.
                                         */
                                        habits.slice(0, 8).map((h) => (
                                            <div
                                                key={h.id}
                                                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
                                            >
                                                {/* Texte principal */}
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-zinc-900">{h.name}</p>
                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        {h.category ?? "Sans catégorie"} •{" "}
                                                        <span className="font-medium text-zinc-700">
                                                            {h.frequency === "daily"
                                                                ? "Daily"
                                                                : `Weekly ${(h.weekly_target ?? h.weeklyTarget ?? "?") as never}x`}
                                                        </span>
                                                    </p>
                                                </div>

                                                {/* Statut du jour + bouton voir */}
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
