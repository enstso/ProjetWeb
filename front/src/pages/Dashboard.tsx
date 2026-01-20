// frontend/src/pages/Dashboard.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    const email = user?.email ?? "";
    const initials = (email[0] ?? "U").toUpperCase();

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-md">
                <Card className="overflow-hidden">
                    {/* Bandeau */}
                    <div className="h-24 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700" />

                    {/* Header (avec avatar) */}
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-white border border-zinc-200 shadow-sm grid place-items-center">
                                <span className="text-xl font-bold text-zinc-900">{initials}</span>
                            </div>

                            <div className="min-w-0">
                                <CardTitle>Dashboard</CardTitle>
                                <CardDescription className="truncate">
                                    Bonjour <span className="font-semibold text-zinc-900">{email}</span>
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Content */}
                    <CardContent className="space-y-4">
                        {/* Message */}
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                            <p className="text-sm text-zinc-700">
                                Tu es connecté ✅ Tu peux maintenant gérer tes objectifs et suivre tes habitudes.
                            </p>
                        </div>

                        {/* Mini-stats (placeholder pour plus tard) */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                                <p className="text-xs text-zinc-500">Objectifs</p>
                                <p className="mt-1 text-lg font-semibold text-zinc-900">—</p>
                            </div>

                            <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                                <p className="text-xs text-zinc-500">Streak</p>
                                <p className="mt-1 text-lg font-semibold text-zinc-900">—</p>
                            </div>

                            <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                                <p className="text-xs text-zinc-500">Aujourd’hui</p>
                                <p className="mt-1 text-lg font-semibold text-zinc-900">—</p>
                            </div>
                        </div>
                    </CardContent>

                    {/* Footer */}
                    <CardFooter className="flex-col gap-2">
                        <Button variant="secondary" className="w-full" onClick={handleLogout}>
                            Se déconnecter
                        </Button>

                        <p className="text-xs text-zinc-500">
                            Astuce : commence par créer ton premier objectif 🎯
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
