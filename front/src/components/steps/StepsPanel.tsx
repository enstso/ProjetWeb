import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { useSteps, type Step } from "../../hooks/useSteps";

export function StepsPanel({ goalId }: { goalId: string | number }) {
    // ✅ plus besoin de completeStep
    const { loading, error, listSteps, addStep, updateStep, deleteStep, isDone } = useSteps();

    const [steps, setSteps] = useState<Step[]>([]);
    const [newTitle, setNewTitle] = useState("");
    const [newDeadline, setNewDeadline] = useState("");

    const [editId, setEditId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDeadline, setEditDeadline] = useState("");

    async function refresh() {
        const data = await listSteps(goalId);
        setSteps(data);
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goalId]);

    async function onAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newTitle.trim()) return;

        const created = await addStep(goalId, {
            title: newTitle.trim(),
            deadline: newDeadline || undefined,
        });

        setSteps((prev) => [...prev, created]);
        setNewTitle("");
        setNewDeadline("");
    }

    function startEdit(s: Step) {
        setEditId(s.id);
        setEditTitle(s.title ?? "");
        setEditDeadline((s.deadline ?? "") as string);
    }

    async function onSaveEdit() {
        if (!editId) return;
        if (!editTitle.trim()) return;

        const updated = await updateStep(editId, {
            title: editTitle.trim(),
            deadline: editDeadline || undefined,
        });

        setSteps((prev) => prev.map((s) => (s.id === editId ? updated : s)));
        setEditId(null);
    }

    // ✅ TOGGLE completed (check/uncheck)
    async function onToggleCompleted(step: Step) {
        const done = isDone(step);

        const updated = await updateStep(step.id, {
            is_completed: !done,
        });

        setSteps((prev) => prev.map((s) => (s.id === step.id ? updated : s)));
    }

    async function onDelete(id: number) {
        if (!confirm("Supprimer cette étape ?")) return;
        await deleteStep(id);
        setSteps((prev) => prev.filter((s) => s.id !== id));
    }

    const doneCount = steps.filter((s) => isDone(s)).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Étapes</CardTitle>
                <CardDescription>
                    {doneCount}/{steps.length} complétée(s)
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {/* Liste */}
                <div className="space-y-2">
                    {steps.map((s) => {
                        const done = isDone(s);
                        const isEditing = editId === s.id;

                        return (
                            <div key={s.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <Input label="Titre" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                        <Input
                                            label="Deadline (optionnel)"
                                            type="date"
                                            value={editDeadline}
                                            onChange={(e) => setEditDeadline(e.target.value)}
                                        />

                                        <div className="flex gap-2">
                                            <Button className="w-full" onClick={onSaveEdit}>
                                                Enregistrer
                                            </Button>
                                            <Button variant="secondary" className="w-full" onClick={() => setEditId(null)}>
                                                Annuler
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
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
                                            {/* ✅ Toggle button */}
                                            <button
                                                type="button"
                                                onClick={() => onToggleCompleted(s)}
                                                className={[
                                                    "h-9 w-9 rounded-xl border text-sm font-semibold transition",
                                                    done
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                                                ].join(" ")}
                                                title={done ? "Décocher" : "Cocher"}
                                            >
                                                {done ? "✓" : "○"}
                                            </button>

                                            <Button variant="secondary" onClick={() => startEdit(s)}>
                                                ✎
                                            </Button>
                                            <Button variant="secondary" onClick={() => onDelete(s.id)}>
                                                🗑
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {steps.length === 0 ? (
                        <p className="text-sm text-zinc-600">Aucune étape. Ajoute-en une pour progresser.</p>
                    ) : null}
                </div>

                {/* Ajout */}
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
                    <Button disabled={loading} className="w-full">
                        {loading ? "Ajout..." : "Ajouter l’étape"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
