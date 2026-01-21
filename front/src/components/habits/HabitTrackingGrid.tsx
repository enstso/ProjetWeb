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
    // YYYY-MM-DD dans le timezone du navigateur
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
    // 0 = lundi ... 6 = dimanche
    const js = date.getDay(); // 0=dimanche
    return (js + 6) % 7;
}

function normalizeLogDate(raw: string) {
    // si API renvoie ISO avec time, on garde YYYY-MM-DD
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
                const iso = normalizeLogDate((l as any).date);
                if (iso) set.add(iso);
            }
            setDoneSet(set);
        } catch (e: any) {
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

        const firstWeekday = weekdayMon0(start); // 0..6
        const daysInMonth = end.getDate();

        // on crée une grille 6 semaines max => 42 cases
        const totalCells = 42;
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
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Action impossible.");
        } finally {
            setBusyToday(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle>Suivi</CardTitle>
                        <CardDescription>Grille mensuelle (jours réussis / manqués)</CardDescription>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setMonthCursor((d) => addMonths(d, -1))}>
                            ←
                        </Button>
                        <Button variant="secondary" onClick={() => setMonthCursor(startOfMonth(new Date()))}>
                            Aujourd’hui
                        </Button>
                        <Button variant="secondary" onClick={() => setMonthCursor((d) => addMonths(d, 1))}>
                            →
                        </Button>
                    </div>
                </div>

                <p className="mt-2 text-sm font-semibold text-zinc-900 capitalize">{monthLabel}</p>
            </CardHeader>

            <CardContent className="space-y-4">
                {err ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
                ) : null}

                {/* header jours */}
                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-zinc-600">
                    {["L", "M", "M", "J", "V", "S", "D"].map((d) => (
                        <div key={d} className="text-center">
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
                            "h-10 rounded-xl border text-sm flex items-center justify-center transition";
                        const style = !inMonth
                            ? "border-transparent bg-transparent"
                            : done
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : "border-zinc-200 bg-white text-zinc-700";

                        const todayRing = isToday ? "ring-2 ring-zinc-900/10" : "";

                        return (
                            <div key={idx} className={[base, style, todayRing].join(" ")}>
                                {c.day ?? ""}
                            </div>
                        );
                    })}
                </div>

                {/* actions du jour */}
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
                    <div className="text-sm">
                        <p className="font-semibold text-zinc-900">Aujourd’hui : {todayISO}</p>
                        <p className="text-xs text-zinc-600">
                            Statut :{" "}
                            <span className={isTodayChecked ? "text-emerald-700 font-semibold" : "text-zinc-700 font-semibold"}>
                {isTodayChecked ? "Réussi" : "Non coché"}
              </span>
                        </p>
                    </div>

                    <Button onClick={onToggleToday} disabled={busyToday || loading}>
                        {busyToday ? "..." : isTodayChecked ? "Uncheck" : "Check"}
                    </Button>
                </div>

                {loading ? <p className="text-sm text-zinc-600">Chargement…</p> : null}
            </CardContent>
        </Card>
    );
}

