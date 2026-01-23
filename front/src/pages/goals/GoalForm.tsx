import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { useGoals } from "../../hooks/useGoals";

/**
 * Retourne la date du jour au format "YYYY-MM-DD"
 * (utilisée pour initialiser start_date et deadline dans le formulaire)
 */
function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Page GoalForm
 * - Mode création si pas de :id dans l’URL
 * - Mode édition si /goals/:id/edit (ou équivalent)
 * - Valide côté UI : titre obligatoire, deadline >= start_date
 * - Appelle les endpoints create/update via useGoals()
 */
export default function GoalForm() {
    /**
     * Récupère l’ID depuis l’URL (si présent)
     */
    const { id } = useParams();

    /**
     * isEdit = true si on a un id dans l’URL (édition), sinon création
     */
    const isEdit = Boolean(id);

    /**
     * Hook de navigation (redirection après création/modif)
     */
    const nav = useNavigate();

    /**
     * Hooks API goals
     * - getGoal: charge un goal existant en édition
     * - createGoal/updateGoal: enregistrement
     * - helpers: pour lire startDate/deadline (camelCase/snake_case)
     */
    const { getGoal, createGoal, updateGoal, helpers } = useGoals();

    /**
     * Champs du formulaire (state contrôlé)
     */
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [status, setStatus] = useState<"active" | "completed" | "abandoned">("active");
    const [startDate, setStartDate] = useState(todayISO());
    const [deadline, setDeadline] = useState(todayISO());

    /**
     * États UI : chargement + erreur
     */
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    /**
     * Titre affiché selon le mode (création vs édition)
     */
    const titleText = useMemo(
        () => (isEdit ? "Modifier l’objectif" : "Créer un objectif"),
        [isEdit]
    );

    /**
     * En mode édition :
     * - charge l’objectif existant
     * - remplit les champs du formulaire
     */
    useEffect(() => {
        if (!isEdit) return;

        (async () => {
            setLoading(true);
            try {
                /**
                 * Charge le goal puis hydrate les champs du formulaire
                 */
                const g = await getGoal(id!);
                setTitle(g.title ?? "");
                setDescription(g.description ?? "");
                setCategory(g.category ?? "");

                /**
                 * Casts utilisés car certaines valeurs peuvent être undefined
                 * (et les types TS des setters sont stricts)
                 */
                setPriority((g.priority ?? "medium") as never);
                setStatus((g.status ?? "active") as never);

                /**
                 * helpers gèrent camelCase vs snake_case côté API
                 */
                setStartDate(helpers.getStartDate(g) || todayISO());
                setDeadline(helpers.getDeadline(g) || todayISO());
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                setErr(e?.response?.data?.message ?? "Impossible de charger l’objectif.");
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, id, getGoal, helpers]);

    /**
     * Soumission du formulaire (create ou update)
     */
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        /**
         * Validation UI simple
         */
        if (!title.trim()) {
            setErr("Le titre est obligatoire.");
            return;
        }
        if (deadline < startDate) {
            setErr("La deadline doit être >= start_date.");
            return;
        }

        setLoading(true);

        try {
            if (isEdit) {
                /**
                 * Mode édition : update puis redirection vers le détail
                 */
                await updateGoal(id!, {
                    title,
                    description: description || undefined,
                    category: category || undefined,
                    priority,
                    status,
                    start_date: startDate,
                    deadline,
                });
                nav(`/goals/${id}`);
            } else {
                /**
                 * Mode création : create puis redirection vers le détail du nouvel objectif
                 */
                const created = await createGoal({
                    title,
                    description: description || undefined,
                    category: category || undefined,
                    priority,
                    status,
                    start_date: startDate,
                    deadline,
                });
                nav(`/goals/${created.id}`);
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
                    {/* En-tête : titre + description */}
                    <CardHeader>
                        <CardTitle>{titleText}</CardTitle>
                        <CardDescription>
                            Renseigne les infos principales (dates, priorité, statut).
                        </CardDescription>
                    </CardHeader>

                    {/* Formulaire */}
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            {/* Champs texte */}
                            <Input
                                label="Titre"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={loading}
                                required
                            />

                            <Input
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={loading}
                            />

                            <Input
                                label="Catégorie"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={loading}
                                placeholder="Santé, Carrière..."
                            />

                            {/* Selects (priorité + statut) */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Select
                                    label="Priorité"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as never)}
                                    disabled={loading}
                                >
                                    <option value="low">Basse</option>
                                    <option value="medium">Moyenne</option>
                                    <option value="high">Haute</option>
                                </Select>

                                <Select
                                    label="Statut"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as never)}
                                    disabled={loading}
                                >
                                    <option value="active">En cours</option>
                                    <option value="completed">Complété</option>
                                    <option value="abandoned">Abandonné</option>
                                </Select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Input
                                    label="Date de début"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={loading}
                                    required
                                />

                                <Input
                                    label="Deadline"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            {/* Erreurs */}
                            {err ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {err}
                                </div>
                            ) : null}

                            {/* Submit */}
                            <Button className="w-full" disabled={loading}>
                                {loading ? "Enregistrement..." : "Sauvegarder"}
                            </Button>
                        </form>
                    </CardContent>

                    {/* Footer : retour liste */}
                    <CardFooter className="justify-between">
                        <Link to="/goals">
                            <Button variant="secondary" disabled={loading}>
                                Retour
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
