import { useEffect, useState } from "react";
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
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setFullName(user?.fullName ?? "");
        setEmail(user?.email ?? "");
    }, [user]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setErr(null);
        setLoading(true);

        try {
            await updateProfile({ fullName, email });
            setMsg("Profil mis à jour ✅");
        } catch (e: any) {
            // Axios: e.response?.data?.message
            setErr(e?.response?.data?.message ?? "Impossible de mettre à jour le profil.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-md">
                <Card className="overflow-hidden">
                    <div className="h-20 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700" />

                    <CardHeader>
                        <CardTitle>Mon profil</CardTitle>
                        <CardDescription>Consulte et modifie tes informations.</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <Input
                                label="Nom"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Ton nom"
                                disabled={loading}
                            />

                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="toi@mail.com"
                                disabled={loading}
                                required
                            />

                            {msg ? (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                    {msg}
                                </div>
                            ) : null}

                            {err ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {err}
                                </div>
                            ) : null}

                            <Button variant={"primary"} className="w-full" disabled={loading}>
                                {loading ? "Sauvegarde..." : "Sauvegarder"}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex-col gap-2">
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => navigate("/dashboard")}
                            disabled={loading}
                        >
                            Retour Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
