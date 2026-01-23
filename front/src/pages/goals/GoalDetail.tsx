import {useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "../../components/ui/Card";
import {Button} from "../../components/ui/Button";
import {ProgressBar} from "../../components/ui/ProgressBar";
import {useGoals, type Goal} from "../../hooks/useGoals";
import {StepsPanel} from "../../components/steps/StepsPanel";

/**
 * Page GoalDetail
 * - Affiche le détail d’un objectif
 * - Affiche la progression (via endpoint /goals/:id/progress)
 * - Permet : compléter / supprimer / aller modifier
 * - Inclut le panneau Steps pour gérer les étapes de l’objectif
 */
export default function GoalDetail() {
    /**
     * Récupère l'ID depuis l'URL /goals/:id
     */
    const {id} = useParams();

    /**
     * Hook de navigation (redirections après delete, etc.)
     */
    const nav = useNavigate();

    /**
     * Hooks API objectifs
     * - getGoal: GET /goals/:id
     * - getProgress: GET /goals/:id/progress
     * - completeGoal: PATCH /goals/:id/complete
     * - deleteGoal: DELETE /goals/:id
     * - helpers: fonctions de lecture startDate/deadline (camelCase/snake_case)
     */
    const {getGoal, deleteGoal, completeGoal, getProgress, helpers} = useGoals();

    /**
     * State principal : objectif chargé depuis l’API
     */
    const [goal, setGoal] = useState<Goal | null>(null);

    /**
     * Gestion de l’état de chargement global de la page
     */
    const [loading, setLoading] = useState(true);

    /**
     * Gestion des erreurs (message affiché en haut)
     */
    const [err, setErr] = useState<string | null>(null);

    /**
     * Progression (pourcentage) renvoyée par /goals/:id/progress
     */
    const [progress, setProgress] = useState(0);

    /**
     * Métadonnées de progression : total steps / steps complétées
     * (utile pour afficher 2/5 etc.)
     */
    const [progressMeta, setProgressMeta] = useState<{ total: number; done: number }>({
        total: 0,
        done: 0,
    });

    /**
     * Recharge toutes les données nécessaires :
     * - Détails de l’objectif
     * - Progression calculée à partir des steps
     */
    async function refresh() {
        if (!id) return;

        setLoading(true);
        setErr(null);

        try {
            /**
             * 1) Charge l’objectif
             */
            const g = await getGoal(id);
            setGoal(g);

            /**
             * 2) Charge la progression
             */
            const p = await getProgress(id);
            setProgress(p.progress_percent);
            setProgressMeta({total: p.total_steps, done: p.completed_steps});
        } catch (e) {

            // @ts-expect-error - on récupère un message backend si présent
            setErr(e?.response?.data?.message ?? "Impossible de charger l’objectif.");
        } finally {
            setLoading(false);
        }
    }

    /**
     * Au montage (et quand l’ID change), on recharge le contenu.
     */
    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    /**
     * Action : marquer l’objectif comme complété
     * - Met à jour l’état local "goal"
     * - (Optionnel) tu pourrais aussi appeler refresh() si tu veux recharger progress
     */
    async function onCompleteGoal() {
        if (!id) return;

        try {
            const updated = await completeGoal(id);
            setGoal(updated);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Impossible de compléter l’objectif.");
        }
    }

    /**
     * Action : supprimer l’objectif
     * - Confirmation UI
     * - Redirection vers /goals après suppression
     */
    async function onDelete() {
        if (!id) return;
        if (!confirm("Supprimer cet objectif ?")) return;

        try {
            await deleteGoal(id);
            nav("/goals");
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Impossible de supprimer l’objectif.");
        }
    }

    /**
     * États UI de chargement / erreur / absence d’objectif
     */
    if (loading) return <div className="p-4 sm:p-6 text-sm text-zinc-600">Chargement...</div>;
    if (err) return <div className="p-4 sm:p-6 text-sm text-red-700">{err}</div>;
    if (!goal) return null;

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4 sm:p-6">
            <div className="mx-auto w-full max-w-2xl space-y-4">
                <Card>
                    <CardHeader className="space-y-2">
                        {/* Titre de l’objectif */}
                        <CardTitle className="break-words">{goal.title}</CardTitle>

                        {/* Badges / infos (status, priority, category) */}
                        <CardDescription className="break-words">
                            {goal.status.toUpperCase()} • {goal.priority.toUpperCase()} •{" "}
                            {goal.category ?? "Sans catégorie"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Progression (calculée côté backend via steps) */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <ProgressBar value={progress} label="Progression de l’objectif"/>
                            <p className="mt-2 text-xs text-zinc-500">
                                {progressMeta.done}/{progressMeta.total} étape(s) complétée(s)
                            </p>
                        </div>

                        {/* Description si présente, sinon placeholder */}
                        {goal.description ? (
                            <div
                                className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-sm text-zinc-700 break-words">
                                {goal.description}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-600">Aucune description.</p>
                        )}

                        {/* Dates (start + deadline) */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Start date</p>
                                <p className="mt-1 font-semibold text-zinc-900 break-words">
                                    {helpers.getStartDate(goal) || "—"}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Deadline</p>
                                <p className="mt-1 font-semibold text-zinc-900 break-words">
                                    {helpers.getDeadline(goal) || "—"}
                                </p>
                            </div>
                        </div>

                        {/* CTA : compléter l’objectif */}
                        {goal.status !== "completed" ? (
                            <Button className="w-full" onClick={onCompleteGoal}>
                                Marquer l’objectif comme complété
                            </Button>
                        ) : (
                            <div
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                Objectif complété ✅
                            </div>
                        )}
                    </CardContent>

                    {/* Footer : navigation + actions */}
                    <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        {/* Bouton retour : pleine largeur en mobile */}
                        <Link to="/goals" className="w-full sm:w-auto">
                            <Button variant="secondary" className="w-full sm:w-auto">
                                Retour liste
                            </Button>
                        </Link>

                        {/* Actions : stack mobile / inline desktop */}
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Link to={`/goals/${goal.id}/edit`} className="w-full sm:w-auto">
                                <Button variant="secondary" className="w-full sm:w-auto">
                                    Modifier
                                </Button>
                            </Link>

                            <Button
                                variant="secondary"
                                onClick={onDelete}
                                className="w-full sm:w-auto"
                            >
                                Supprimer
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

                {/* Steps : gestion des étapes (add/edit/toggle/delete) */}
                <StepsPanel goalId={goal.id}/>

                {/* Refresh manuel : utile pour recalculer la progression après actions sur steps */}
                <Button variant="secondary" className="w-full" onClick={refresh}>
                    Rafraîchir la progression
                </Button>
            </div>
        </div>
    );
}
