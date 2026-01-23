import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { useHabits } from "../../hooks/useHabits";

type HabitLog = {
    id: number;
    date: string; // "YYYY-MM-DD" ou ISO
};

function pad(n: number) {
    return String(n).padStart(2, "0");
}

function toLocalISODate(d: Date) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, delta: number) {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function weekdayMon0(date: Date) {
    const js = date.getDay(); // 0=dimanche
    return (js + 6) % 7; // 0=lundi ... 6=dimanche
}

function normalizeLogDate(raw: string) {
    return raw?.slice(0, 10);
}

export function HabitTrackingGrid({ habitId }: { habitId: string | number }) {
    const { getLogs, checkToday, uncheck } = useHabits();

    const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
    const [doneSet, setDoneSet] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [busyToday, setBusyToday] = useState(false);

    const todayISO = useMemo(() => toLocalISODate(new Date()), []);
    const monthLabel = useMemo(
        () => monthCursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
        [monthCursor]
    );

    const range = useMemo(() => {
        const start = startOfMonth(monthCursor);
        const end = endOfMonth(monthCursor);
        return { startISO: toLocalISODate(start), endISO: toLocalISODate(end) };
    }, [monthCursor]);

    async function refresh() {
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
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Impossible de charger le tracking.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [habitId, range.startISO, range.endISO]);

    const cells = useMemo(() => {
        const start = startOfMonth(monthCursor);
        const end = endOfMonth(monthCursor);

        const firstWeekday = weekdayMon0(start);
        const daysInMonth = end.getDate();

        const totalCells = 42; // 6 semaines
        const out: Array<{ iso: string | null; day: number | null }> = [];

        for (let i = 0; i < totalCells; i++) {
            const dayNum = i - firstWeekday + 1;
            if (dayNum < 1 || dayNum > daysInMonth) {
                out.push({ iso: null, day: null });
            } else {
                const d = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), dayNum);
                out.push({ iso: toLocalISODate(d), day: dayNum });
            }
        }
        return out;
    }, [monthCursor]);

    const isTodayChecked = doneSet.has(todayISO);

    async function onToggleToday() {
        setBusyToday(true);
        setErr(null);
        try {
            if (!isTodayChecked) {
                await checkToday(habitId);
            } else {
                await uncheck(habitId, todayISO);
            }
            await refresh();
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Action impossible.");
        } finally {
            setBusyToday(false);
        }
    }

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
                            onClick={() => setMonthCursor((d) => addMonths(d, -1))}
                        >
                            ←
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            onClick={() => setMonthCursor(startOfMonth(new Date()))}
                        >
                            Aujourd’hui
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            onClick={() => setMonthCursor((d) => addMonths(d, 1))}
                        >
                            →
                        </Button>
                    </div>
                </div>

                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{monthLabel}</p>
            </CardHeader>

            <CardContent className="space-y-4">
                {err ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                        {err}
                    </div>
                ) : null}

                {/* header jours */}
                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                        <div key={`${d}-${i}`} className="text-center">
                            {d}
                        </div>
                    ))}
                </div>

                {/* grille */}
                <div className="grid grid-cols-7 gap-2">
                    {cells.map((c, idx) => {
                        const iso = c.iso;
                        const inMonth = Boolean(iso);
                        const done = iso ? doneSet.has(iso) : false;
                        const isToday = iso === todayISO;

                        const base =
                            "h-10 rounded-xl border text-sm flex items-center justify-center transition select-none";
                        const style = !inMonth
                            ? "border-transparent bg-transparent"
                            : done
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
                                : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200";

                        const todayRing = isToday
                            ? "ring-2 ring-zinc-900/10 dark:ring-zinc-100/10"
                            : "";

                        const todayBadge = isToday ? "font-semibold" : "font-medium";

                        return (
                            <div key={idx} className={[base, style, todayRing, todayBadge].join(" ")}>
                                {c.day ?? ""}
                            </div>
                        );
                    })}
                </div>

                {/* actions du jour */}
                <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Aujourd’hui : {todayISO}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">
                            Statut :{" "}
                            <span
                                className={
                                    isTodayChecked
                                        ? "font-semibold text-emerald-700 dark:text-emerald-300"
                                        : "font-semibold text-zinc-700 dark:text-zinc-200"
                                }
                            >
                {isTodayChecked ? "Réussi" : "Non coché"}
              </span>
                        </p>
                    </div>

                    <Button
                        onClick={onToggleToday}
                        disabled={busyToday || loading}
                        className="w-full sm:w-auto"
                    >
                        {busyToday ? "..." : isTodayChecked ? "Uncheck" : "Check"}
                    </Button>
                </div>

                {loading ? <p className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</p> : null}
            </CardContent>
        </Card>
    );
}
