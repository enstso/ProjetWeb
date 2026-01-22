import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { useHabits } from "../../hooks/useHabits";

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default function HabitForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const nav = useNavigate();
    const { getOne, create, update } = useHabits();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
    const [weeklyTarget, setWeeklyTarget] = useState(3);
    const [startDate, setStartDate] = useState(todayISO());
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const title = useMemo(() => (isEdit ? "Modifier une habitude" : "Créer une habitude"), [isEdit]);

    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            setLoading(true);
            try {
                const h = await getOne(id!);
                setName(h.name ?? "");
                setDescription((h.description ?? "") as string);
                setCategory((h.category ?? "") as string);
                setFrequency(h.frequency ?? "daily");
                setWeeklyTarget((h.weekly_target ?? h.weeklyTarget ?? 3) as number);
                setStartDate((h.start_date ?? h.startDate ?? todayISO()) as string);
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                setErr(e?.response?.data?.message ?? "Impossible de charger l’habitude.");
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, id, getOne]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        if (!name.trim()) return setErr("Le nom est obligatoire.");
        if (frequency === "weekly" && (!weeklyTarget || weeklyTarget < 1)) return setErr("weekly_target doit être >= 1.");

        setLoading(true);
        try {
            if (isEdit) {
                await update(id!, {
                    name,
                    description: description || undefined,
                    category: category || undefined,
                    frequency,
                    weekly_target: frequency === "weekly" ? weeklyTarget : undefined,
                    start_date: startDate,
                });
                nav("/habits");
            } else {
                await create({
                    name,
                    description: description || undefined,
                    category: category || undefined,
                    frequency,
                    weekly_target: frequency === "weekly" ? weeklyTarget : undefined,
                    start_date: startDate,
                });
                nav("/habits");
            }
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Erreur lors de l’enregistrement.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>Daily ou Weekly (avec weekly_target).</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
                            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                            <Input label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Santé, Carrière..." />

                            <Select label="Fréquence" value={frequency} onChange={(e) => setFrequency(e.target.value as never)}>
                                <option value="daily">Quotidienne</option>
                                <option value="weekly">Hebdomadaire</option>
                            </Select>

                            {frequency === "weekly" ? (
                                <Input
                                    label="Objectif hebdo (weekly_target)"
                                    type="number"
                                    min={1}
                                    value={weeklyTarget}
                                    onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                                />
                            ) : null}

                            <Input label="Date de début" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

                            {err ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
                            ) : null}

                            <Button className="w-full" disabled={loading}>
                                {loading ? "Enregistrement..." : "Sauvegarder"}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="justify-between">
                        <Link to="/habits"><Button variant="secondary">Retour</Button></Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
