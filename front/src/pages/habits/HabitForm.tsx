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
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { useHabits } from "../../hooks/useHabits";

/**
 * Retourne la date du jour au format ISO "YYYY-MM-DD" (timezone du navigateur).
 * Utile pour pré-remplir le champ start_date quand on crée une habitude.
 */
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Formulaire Habitude
 * - Mode création si pas d'id dans l'URL
 * - Mode édition si id présent (/habits/:id/edit)
 *
 * Champs gérés :
 * - name (obligatoire)
 * - description (optionnel)
 * - category (optionnel)
 * - frequency ("daily" ou "weekly")
 * - weekly_target (si weekly uniquement)
 * - start_date
 *
 * Comportement :
 * - En édition : charge l’habitude existante et pré-remplit le formulaire
 * - Au submit : appelle create() ou update() puis redirige vers /habits
 */
export default function HabitForm() {
    /**
     * id vient de l’URL. S’il existe => on est en mode édition.
     */
    const { id } = useParams();
    const isEdit = Boolean(id);

    /**
     * navigate permet de rediriger après création/modification.
     */
    const nav = useNavigate();

    /**
     * API habits côté front :
     * - getOne : récupère une habitude
     * - create : crée une habitude
     * - update : met à jour une habitude
     */
    const { getOne, create, update } = useHabits();

    /**
     * États du formulaire (inputs contrôlés).
     */
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
    const [weeklyTarget, setWeeklyTarget] = useState(3);
    const [startDate, setStartDate] = useState(todayISO());

    /**
     * États UI : erreur + chargement.
     */
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    /**
     * Titre de page dépend du mode (création vs édition).
     */
    const title = useMemo(() => (isEdit ? "Modifier une habitude" : "Créer une habitude"), [isEdit]);

    /**
     * En mode édition :
     * - charge l’habitude via getOne(id)
     * - pré-remplit tous les champs
     *
     * Remarque : on tolère snake_case / camelCase pour les données venant du backend.
     */
    useEffect(() => {
        if (!isEdit) return;

        (async () => {
            setLoading(true);
            try {
                const h = await getOne(id!);

                // Champs simples
                setName(h.name ?? "");
                setDescription((h.description ?? "") as string);
                setCategory((h.category ?? "") as string);

                // Fréquence + weekly_target (fallback à 3 si absent)
                setFrequency(h.frequency ?? "daily");
                setWeeklyTarget((h.weekly_target ?? h.weeklyTarget ?? 3) as number);

                // start_date (fallback à today)
                setStartDate((h.start_date ?? h.startDate ?? todayISO()) as string);
            } catch (e) {
                // Affiche une erreur backend si disponible
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                setErr(e?.response?.data?.message ?? "Impossible de charger l’habitude.");
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, id, getOne]);

    /**
     * Soumission du formulaire :
     * - validation côté UI (nom obligatoire, weekly_target >= 1 si weekly)
     * - create ou update
     * - redirection vers /habits
     */
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        // Validation minimale côté front
        if (!name.trim()) return setErr("Le nom est obligatoire.");
        if (frequency === "weekly" && (!weeklyTarget || weeklyTarget < 1))
            return setErr("weekly_target doit être >= 1.");

        setLoading(true);
        try {
            if (isEdit) {
                // Update : on envoie weekly_target uniquement si weekly
                await update(id!, {
                    name,
                    description: description || undefined,
                    category: category || undefined,
                    frequency,
                    weekly_target: frequency === "weekly" ? weeklyTarget : undefined,
                    start_date: startDate,
                });

                // Après update, on revient sur la liste
                nav("/habits");
            } else {
                // Create : même logique que update
                await create({
                    name,
                    description: description || undefined,
                    category: category || undefined,
                    frequency,
                    weekly_target: frequency === "weekly" ? weeklyTarget : undefined,
                    start_date: startDate,
                });

                // Après création, on revient sur la liste
                nav("/habits");
            }
        } catch (e) {
            // Erreur backend si dispo
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
                    {/* En-tête : titre + description */}
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>Daily ou Weekly (avec weekly_target).</CardDescription>
                    </CardHeader>

                    {/* Form */}
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            {/* Nom obligatoire */}
                            <Input
                                label="Nom"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />

                            {/* Optionnels */}
                            <Input
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <Input
                                label="Catégorie"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Santé, Carrière..."
                            />

                            {/* Choix fréquence */}
                            <Select
                                label="Fréquence"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as never)}
                            >
                                <option value="daily">Quotidienne</option>
                                <option value="weekly">Hebdomadaire</option>
                            </Select>

                            {/* weekly_target affiché uniquement si weekly */}
                            {frequency === "weekly" ? (
                                <Input
                                    label="Objectif hebdo (weekly_target)"
                                    type="number"
                                    min={1}
                                    value={weeklyTarget}
                                    onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                                />
                            ) : null}

                            {/* start_date */}
                            <Input
                                label="Date de début"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />

                            {/* Affichage erreur */}
                            {err ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {err}
                                </div>
                            ) : null}

                            {/* Bouton submit */}
                            <Button className="w-full" disabled={loading}>
                                {loading ? "Enregistrement..." : "Sauvegarder"}
                            </Button>
                        </form>
                    </CardContent>

                    {/* Footer : retour liste */}
                    <CardFooter className="justify-between">
                        <Link to="/habits">
                            <Button variant="secondary">Retour</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
