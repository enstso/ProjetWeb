import { Card, CardContent } from "../ui/Card";

function Skel({ className = "" }: { className?: string }) {
    return <div className={["animate-pulse rounded-xl bg-zinc-200/70", className].join(" ")} />;
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <Card key={i}>
                        <CardContent className="space-y-3">
                            <Skel className="h-3 w-24" />
                            <Skel className="h-8 w-20" />
                            <Skel className="h-3 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Panels */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {[0, 1].map((i) => (
                    <Card key={i}>
                        <CardContent className="space-y-3">
                            <Skel className="h-4 w-40" />
                            <Skel className="h-3 w-56" />
                            <div className="space-y-2 pt-2">
                                {[0, 1, 2].map((j) => (
                                    <div key={j} className="rounded-2xl border border-zinc-200 bg-white p-3">
                                        <Skel className="h-4 w-56" />
                                        <Skel className="mt-2 h-3 w-32" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Skel className="h-10 w-full" />
                                <Skel className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
