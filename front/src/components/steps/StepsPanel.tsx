import React, { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { useSteps, type Step } from "../../hooks/useSteps";
import { useToast } from "../ui/Toast";
import { pickMotivation } from "../../utils/motivation";

/**
 * Panel UI pour gérer les étapes (steps) d’un objectif :
 * - charger la liste
 * - ajouter / éditer / supprimer
 * - toggle complété (check / uncheck)
 * - feedback utilisateur via toasts
 */
export function StepsPanel({ goalId }: Readonly<{ goalId: string | number }>) {
    /**
     * Hook métier qui encapsule les appels API (CRUD steps)
     * + loading/error global + helper isDone() (snake_case/camelCase).
     */
    const { loading, error, listSteps, addStep, updateStep, deleteStep, isDone } = useSteps();

    /** Liste des steps affichées dans le panel */
    const [steps, setSteps] = useState<Step[]>([]);
    /** Champs du formulaire d’ajout */
    const [newTitle, setNewTitle] = useState("");
    const [newDeadline, setNewDeadline] = useState("");

    /** Etat d’édition : quel step est en cours d’édition + valeurs temporaires */
    const [editId, setEditId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDeadline, setEditDeadline] = useState("");

    /**
     * ID du step "occupé" (requête en cours) :
     * permet de désactiver les actions sur un step pendant son update/delete/toggle.
     */
    const [busyStepId, setBusyStepId] = useState<number | null>(null);

    /** Toasts (succès/info/erreur) pour feedback immédiat */
    const { push } = useToast();

    /**
     * Recharge la liste des steps côté API et met à jour le state local.
     * En cas d’erreur, on affiche un toast "error".
     */
    async function refresh() {
        try {
            const data = await listSteps(goalId);
            setSteps(data);
        } catch {
            push({
                type: "error",
                title: "Oups",
                message: "Impossible de charger les étapes.",
            });
        }
    }

    /**
     * Au montage du composant (et à chaque changement de goalId),
     * on recharge la liste des steps.
     *
     * Note: eslint-disable car refresh n’est pas dans les deps volontairement
     * (on veut rerun uniquement sur goalId).
     */
    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goalId]);

    /**
     * Soumission du formulaire "ajout d’étape".
     * - validation simple: titre non vide
     * - appel API
     * - ajout optimiste dans la liste locale
     * - reset du formulaire
     * - toast succès/erreur
     */
    async function onAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            const created = await addStep(goalId, {
                title: newTitle.trim(),
                deadline: newDeadline || undefined,
            });

            setSteps((prev) => [...prev, created]);
            setNewTitle("");
            setNewDeadline("");

            push({
                type: "success",
                title: "Étape ajoutée ✨",
                message: "Nickel ! Une étape de plus vers ton objectif.",
            });
        } catch {
            push({
                type: "error",
                title: "Oups",
                message: "Impossible d’ajouter l’étape. Réessaie.",
            });
        }
    }

    /**
     * Passe un step en mode édition:
     * - stocke son id
     * - pré-remplit les champs d’édition avec les valeurs existantes
     */
    function startEdit(s: Step) {
        setEditId(s.id);
        setEditTitle(s.title ?? "");
        setEditDeadline((s.deadline ?? ""));
    }

    /**
     * Sauvegarde du step en cours d’édition (PUT /steps/:id):
     * - garde-fous: editId et editTitle non vide
     * - désactive les actions sur ce step via busyStepId
     * - met à jour la liste locale avec le step retourné
     * - sort du mode édition si ok
     * - toasts succès/erreur
     */
    async function onSaveEdit() {
        if (!editId) return;
        if (!editTitle.trim()) return;

        setBusyStepId(editId);
        try {
            const updated = await updateStep(editId, {
                title: editTitle.trim(),
                deadline: editDeadline || undefined,
            });

            setSteps((prev) => prev.map((s) => (s.id === editId ? updated : s)));
            setEditId(null);

            push({
                type: "success",
                title: "Modifications enregistrées ✅",
                message: "Parfait, c’est à jour.",
            });
        } catch {
            push({
                type: "error",
                title: "Oups",
                message: "Impossible d’enregistrer. Réessaie.",
            });
        } finally {
            setBusyStepId(null);
        }
    }

    /**
     * Toggle completed (check/uncheck) :
     * - calcule l’état actuel via isDone()
     * - envoie un update avec is_completed inversé
     * - met à jour la liste locale avec le step retourné
     * - toast motivant si on coche, toast info si on décoche
     */
    async function onToggleCompleted(step: Step) {
        const done = isDone(step);
        setBusyStepId(step.id);

        try {
            const updated = await updateStep(step.id, {
                is_completed: !done,
            });

            setSteps((prev) => prev.map((s) => (s.id === step.id ? updated : s)));

            if (!done) {
                push({
                    type: "success",
                    title: "Étape complétée ✅",
                    message: pickMotivation(),
                });
            } else {
                push({
                    type: "info",
                    title: "Étape décochée",
                    message: "Pas grave — tu peux la re-cocher quand tu veux 🙂",
                });
            }
        } catch {
            push({
                type: "error",
                title: "Oups",
                message: "Impossible de mettre à jour cette étape. Réessaie.",
            });
        } finally {
            setBusyStepId(null);
        }
    }

    /**
     * Suppression d’une étape:
     * - confirmation via confirm()
     * - désactive les actions sur le step via busyStepId
     * - supprime côté API puis filtre côté UI
     * - toast succès/erreur
     */
    async function onDelete(id: number) {
        if (!confirm("Supprimer cette étape ?")) return;

        setBusyStepId(id);
        try {
            await deleteStep(id);
            setSteps((prev) => prev.filter((s) => s.id !== id));

            push({
                type: "success",
                title: "Étape supprimée",
                message: "Ok — on reste focus sur l’essentiel 💡",
            });
        } catch {
            push({
                type: "error",
                title: "Oups",
                message: "Impossible de supprimer. Réessaie.",
            });
        } finally {
            setBusyStepId(null);
        }
    }

    /** Compteur d’étapes terminées (affiché dans le header) */
    const doneCount = steps.filter((s) => isDone(s)).length;

    return (
        <Card>
            {/* En-tête du panel: titre + compteur done/total */}
            <CardHeader>
                <CardTitle>Étapes</CardTitle>
                <CardDescription>
                    {doneCount}/{steps.length} complétée(s)
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Erreur globale du hook (ex: listSteps) */}
                {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {/* Liste des étapes */}
                <div className="space-y-2">
                    {steps.map((s) => {
                        /** Etat calculé: done / editing / busy (actions désactivées) */
                        const done = isDone(s);
                        const isEditing = editId === s.id;
                        const busy = busyStepId === s.id;

                        return (
                            <div
                                key={s.id}
                                className={[
                                    // carte step
                                    "rounded-2xl border p-3 transition",
                                    // style variant si complété
                                    done ? "border-emerald-200 bg-emerald-50/60" : "border-zinc-200 bg-white",
                                    // feedback visuel si requête en cours sur ce step
                                    busy ? "opacity-70" : "",
                                ].join(" ")}
                            >
                                {isEditing ? (
                                    /**
                                     * Mode édition : inputs + boutons Enregistrer/Annuler
                                     * Le disabled sur les boutons empêche double-submit.
                                     */
                                    <div className="space-y-3">
                                        <Input label="Titre" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                        <Input
                                            label="Deadline (optionnel)"
                                            type="date"
                                            value={editDeadline}
                                            onChange={(e) => setEditDeadline(e.target.value)}
                                        />

                                        <div className="flex gap-2">
                                            <Button className="w-full" onClick={onSaveEdit} disabled={busyStepId === editId}>
                                                Enregistrer
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                className="w-full"
                                                onClick={() => setEditId(null)}
                                                disabled={busyStepId === editId}
                                            >
                                                Annuler
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /**
                                     * Mode lecture : titre + deadline + actions (toggle/edit/delete)
                                     */
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className={`font-semibold ${done ? "text-zinc-500 line-through" : "text-zinc-900"}`}>
                                                {s.title}
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-500">
                                                Deadline: <span className="font-medium text-zinc-700">{s.deadline ?? "—"}</span>
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 gap-2">
                                            {/* Toggle check/uncheck (bouton custom) */}
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => onToggleCompleted(s)}
                                                className={[
                                                    "h-9 w-9 rounded-xl border text-sm font-semibold transition",
                                                    busy ? "pointer-events-none opacity-70" : "",
                                                    done
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                                                ].join(" ")}
                                                title={done ? "Décocher" : "Cocher"}
                                            >
                                                {done ? "✓" : "○"}
                                            </button>

                                            {/* Action: passer en édition */}
                                            <Button variant="secondary" onClick={() => startEdit(s)} disabled={busy}>
                                                ✎
                                            </Button>

                                            {/* Action: supprimer */}
                                            <Button variant="secondary" onClick={() => onDelete(s.id)} disabled={busy}>
                                                🗑
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Etat vide */}
                    {steps.length === 0 ? (
                        <p className="text-sm text-zinc-600">Aucune étape. Ajoute-en une pour progresser.</p>
                    ) : null}
                </div>

                {/* Formulaire d’ajout d’étape */}
                <form onSubmit={onAdd} className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                    <Input
                        label="Nouvelle étape"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ex: Faire la migration DB"
                    />
                    <Input
                        label="Deadline (optionnel)"
                        type="date"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                    />
                    {/* loading désactive le bouton et change le texte */}
                    <Button disabled={loading} className="w-full">
                        {loading ? "Ajout..." : "Ajouter l’étape"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
