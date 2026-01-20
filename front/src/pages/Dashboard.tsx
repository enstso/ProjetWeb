// frontend/src/pages/Dashboard.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    CardDescription,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    const initials =
        (user?.email?.[0] ?? "U").toUpperCase();

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white grid place-items-center p-4">
            <Card className="w-full max-w-md overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-zinc-900 to-zinc-700" />

                <CardHeader className="-mt-10">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-zinc-200 grid place-items-center">
                            <span className="text-xl font-bold text-zinc-900">{initials}</span>
                        </div>

                        <div className="min-w-0">
                            <CardTitle className="text-zinc-900">Dashboard</CardTitle>
                            <CardDescription className="truncate">
                                Bonjour <span className="font-semibold">{user?.email}</span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                        <p className="text-sm text-zinc-700">
                            Tu es connecté. Tu peux maintenant accéder à tes objectifs et habitudes.
                        </p>
                    </div>

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

                <CardFooter className="gap-2">
                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        Se déconnecter
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
