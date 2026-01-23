export function ProgressBar({
                                value,
                                label,
                            }: Readonly<{
    value: number; // 0..100
    label?: string;
}>) {
    const v = Math.max(0, Math.min(100, value));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-800">{label ?? "Progression"}</p>
                <p className="text-sm font-semibold text-zinc-900">{v}%</p>
            </div>

            <div className="h-3 w-full rounded-full border border-zinc-200 bg-zinc-100 overflow-hidden">
                <div
                    className="h-full rounded-full bg-zinc-900 transition-all"
                    style={{ width: `${v}%` }}
                />
            </div>
        </div>
    );
}
