import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useGoals, type Goal } from "../../hooks/useGoals";
import { StepsPanel } from "../../components/steps/StepsPanel"; // si tu l’as déjà

export default function GoalDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { getGoal, deleteGoal, completeGoal, getProgress, helpers } = useGoals();

    const [goal, setGoal] = useState<Goal | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [progress, setProgress] = useState(0);
    const [progressMeta, setProgressMeta] = useState<{ total: number; done: number }>({ total: 0, done: 0 });

    async function refresh() {
        if (!id) return;
        setLoading(true);
        setErr(null);
        try {
            const g = await getGoal(id);
            setGoal(g);

            const p = await getProgress(id);
            setProgress(p.progress_percent);
            setProgressMeta({ total: p.total_steps, done: p.completed_steps });
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Impossible de charger l’objectif.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function onCompleteGoal() {
        if (!id) return;
        try {
            const updated = await completeGoal(id);
            setGoal(updated);
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Impossible de compléter l’objectif.");
        }
    }

    async function onDelete() {
        if (!id) return;
        if (!confirm("Supprimer cet objectif ?")) return;
        try {
            await deleteGoal(id);
            nav("/goals");
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Impossible de supprimer l’objectif.");
        }
    }

    if (loading) return <div className="p-6 text-sm text-zinc-600">Chargement...</div>;
    if (err) return <div className="p-6 text-sm text-red-700">{err}</div>;
    if (!goal) return null;

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-2xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{goal.title}</CardTitle>
                        <CardDescription>
                            {goal.status.toUpperCase()} • {goal.priority.toUpperCase()} • {goal.category ?? "Sans catégorie"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Progression */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <ProgressBar value={progress} label="Progression de l’objectif" />
                            <p className="mt-2 text-xs text-zinc-500">
                                {progressMeta.done}/{progressMeta.total} étape(s) complétée(s)
                            </p>
                        </div>

                        {goal.description ? (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-sm text-zinc-700">
                                {goal.description}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-600">Aucune description.</p>
                        )}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Start date</p>
                                <p className="mt-1 font-semibold text-zinc-900">{helpers.getStartDate(goal) || "—"}</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs text-zinc-500">Deadline</p>
                                <p className="mt-1 font-semibold text-zinc-900">{helpers.getDeadline(goal) || "—"}</p>
                            </div>
                        </div>

                        {goal.status !== "completed" ? (
                            <Button className="w-full" onClick={onCompleteGoal}>
                                Marquer l’objectif comme complété
                            </Button>
                        ) : (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                Objectif complété ✅
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="justify-between flex-wrap gap-2">
                        <Link to="/goals">
                            <Button variant="secondary">Retour liste</Button>
                        </Link>

                        <div className="flex gap-2">
                            <Link to={`/goals/${goal.id}/edit`}>
                                <Button variant="secondary">Modifier</Button>
                            </Link>
                            <Button variant="secondary" onClick={onDelete}>
                                Supprimer
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

                {/* Steps (si tu veux que la progression se mette à jour après check) */}
                <StepsPanel goalId={goal.id} />

                {/* Bouton “refresh” optionnel si tu veux recalculer la progression après avoir coché des steps */}
                <Button variant="secondary" className="w-full" onClick={refresh}>
                    Rafraîchir la progression
                </Button>
            </div>
        </div>
    );
}
