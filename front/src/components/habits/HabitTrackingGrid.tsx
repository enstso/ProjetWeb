import {useEffect, useMemo, useState} from "react";
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "../ui/Card";
import {Button} from "../ui/Button";
import {useHabits} from "../../hooks/useHabits";

type HabitLog = {
    id: number;
    date: string; // "YYYY-MM-DD" ou ISO
};

function pad(n: number) {
    // Ajoute un zéro devant les nombres < 10 (ex: 3 -> "03")
    return String(n).padStart(2, "0");
}

function toLocalISODate(d: Date) {
    // Convertit une Date en "YYYY-MM-DD" en utilisant l'heure locale
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(date: Date) {
    // Retourne le 1er jour du mois de la date donnée
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
    // Retourne le dernier jour du mois de la date donnée
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, delta: number) {
    // Déplace le curseur au début du mois +/- delta
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function weekdayMon0(date: Date) {
    // Convertit le jour JS (0=dimanche) en index "lundi=0 ... dimanche=6"
    const js = date.getDay(); // 0=dimanche
    return (js + 6) % 7; // 0=lundi ... 6=dimanche
}

function normalizeLogDate(raw: string) {
    // Normalise une date ISO en ne gardant que "YYYY-MM-DD"
    return raw?.slice(0, 10);
}

export function HabitTrackingGrid({habitId}: { habitId: string | number }) {
    const {getLogs} = useHabits();

    // Mois affiché dans la grille (curseur de navigation)
    const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
    // Ensemble des jours cochés (format "YYYY-MM-DD")
    const [doneSet, setDoneSet] = useState<Set<string>>(new Set());
    // États UI
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Date du jour (calculée une fois)
    const todayISO = useMemo(() => toLocalISODate(new Date()), []);
    // Libellé du mois affiché (ex: "janvier 2026")
    const monthLabel = useMemo(
        () => monthCursor.toLocaleDateString("fr-FR", {month: "long", year: "numeric"}),
        [monthCursor]
    );

    // Range ISO correspondant au mois courant (pour charger les logs côté API)
    const range = useMemo(() => {
        const start = startOfMonth(monthCursor);
        const end = endOfMonth(monthCursor);
        return {startISO: toLocalISODate(start), endISO: toLocalISODate(end)};
    }, [monthCursor]);

    async function refresh() {
        // Recharge les logs du mois (et reconstruit doneSet)
        setLoading(true);
        setErr(null);
        try {
            const logs: HabitLog[] = await getLogs(habitId, range.startISO, range.endISO);
            const set = new Set<string>();
            for (const l of logs) {
                const iso = normalizeLogDate(l.date);
                if (iso) set.add(iso);
            }
            setDoneSet(set);
        } catch (e) {
            // Gestion d'erreur (message backend si disponible)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Impossible de charger le tracking.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Recharge quand l'habitude, le mois ou la range change
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [habitId, range.startISO, range.endISO]);

    const cells = useMemo(() => {
        // Construit 42 cellules (6 semaines) pour afficher une grille calendaire stable
        const start = startOfMonth(monthCursor);
        const end = endOfMonth(monthCursor);

        // Jour de la semaine du 1er jour du mois (indexé lundi=0)
        const firstWeekday = weekdayMon0(start);
        const daysInMonth = end.getDate();

        const totalCells = 42; // 6 semaines
        const out: Array<{ iso: string | null; day: number | null }> = [];

        for (let i = 0; i < totalCells; i++) {
            // Positionne le numéro du jour dans la grille en fonction du décalage du 1er jour
            const dayNum = i - firstWeekday + 1;
            if (dayNum < 1 || dayNum > daysInMonth) {
                // Cellules hors mois : vides
                out.push({iso: null, day: null});
            } else {
                // Cellule dans le mois : date ISO + numéro du jour
                const d = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), dayNum);
                out.push({iso: toLocalISODate(d), day: dayNum});
            }
        }
        return out;
    }, [monthCursor]);

    // Le jour courant est-il coché ?
    const isTodayChecked = doneSet.has(todayISO);

    return (
        <Card>
            <CardHeader className="space-y-3">
                {/* Header responsive */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>Suivi</CardTitle>
                        <CardDescription>Grille mensuelle (jours réussis / manqués)</CardDescription>
                    </div>

                    {/* Boutons: wrap mobile */}
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            onClick={() => setMonthCursor((d) => addMonths(d, -1))} // Mois précédent
                        >
                            ←
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            onClick={() => setMonthCursor(startOfMonth(new Date()))} // Revenir au mois courant
                        >
                            Aujourd’hui
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            onClick={() => setMonthCursor((d) => addMonths(d, 1))} // Mois suivant
                        >
                            →
                        </Button>
                    </div>
                </div>

                {/* Libellé du mois affiché */}
                <p className="mt-2 text-sm font-semibold text-zinc-900 capitalize">{monthLabel}</p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Affichage des erreurs */}
                {err ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {err}
                    </div>
                ) : null}

                {/* En-tête des jours de la semaine */}
                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-zinc-600">
                    {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                        <div key={`${d}-${i}`} className="text-center">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grille du mois */}
                <div className="grid grid-cols-7 gap-2">
                    {cells.map((c, idx) => {
                        // iso null => case vide (hors mois)
                        const iso = c.iso;
                        const inMonth = Boolean(iso);
                        // done => jour coché/réussi
                        const done = iso ? doneSet.has(iso) : false;
                        // isToday => la case correspond à aujourd'hui
                        const isToday = iso === todayISO;

                        // Styles de base
                        const base =
                            "h-10 rounded-xl border text-sm flex items-center justify-center transition";
                        // Styles selon état (hors mois / coché / non coché)
                        const style = !inMonth
                            ? "border-transparent bg-transparent"
                            : done
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : "border-zinc-200 bg-white text-zinc-700";

                        // Anneau pour mettre en évidence aujourd'hui
                        const todayRing = isToday ? "ring-2 ring-zinc-900/10" : "";

                        // Police un peu plus forte pour aujourd'hui
                        const todayBadge = isToday ? "font-semibold" : "font-medium";

                        return (
                            <div key={idx} className={[base, style, todayRing, todayBadge].join(" ")}>
                                {/* Affiche le numéro du jour ou rien si case vide */}
                                {c.day ?? ""}
                            </div>
                        );
                    })}
                </div>

                {/* Actions rapides pour aujourd'hui */}
                <div
                    className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
                    <div className="text-sm">
                        <p className="font-semibold text-zinc-900">Aujourd’hui : {todayISO}</p>
                        <p className="text-xs text-zinc-600">
                            Statut :{" "}
                            <span
                                className={
                                    isTodayChecked
                                        ? "text-emerald-700 font-semibold"
                                        : "text-zinc-700 font-semibold"
                                }
                            >
                {isTodayChecked ? "Réussi" : "Non coché"}
              </span>
                        </p>
                    </div>
                </div>

                {/* Indicateur de chargement */}
                {loading ? <p className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</p> : null}
            </CardContent>
        </Card>
    );
}
