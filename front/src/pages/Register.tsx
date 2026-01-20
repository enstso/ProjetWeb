import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        try {
            await register(fullName, email, password);
            nav("/dashboard");
        } catch {
            setErr("Impossible de créer le compte (email déjà utilisé ?).");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full bg-zinc-50 grid place-items-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Créer un compte</CardTitle>
                    <CardDescription>Rejoins l’app et commence ton suivi.</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <Input
                            label="Nom"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ton nom"
                            autoComplete="name"
                            required
                            disabled={loading}
                        />

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ex: toi@mail.com"
                            autoComplete="email"
                            required
                            disabled={loading}
                        />

                        <Input
                            label="Mot de passe"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            required
                            disabled={loading}
                        />

                        {err ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {err}
                            </div>
                        ) : null}

                        <Button disabled={loading} className="w-full">
                            {loading ? "Création..." : "Créer mon compte"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-zinc-600">
                        Déjà un compte ?{" "}
                        <Link className="font-semibold text-zinc-900 underline underline-offset-4" to="/login">
                            Se connecter
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
