import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
    /**
     * Hook d'authentification :
     * - register(fullName, email, password) : crée un compte via l'API backend
     */
    const { register } = useAuth();

    /**
     * Navigation (React Router)
     * - après inscription, on redirige vers /dashboard
     */
    const nav = useNavigate();

    /**
     * Champs du formulaire (controlled inputs)
     */
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    /**
     * UI state :
     * - err : message d'erreur utilisateur
     * - loading : désactive les champs + bouton pendant la requête
     */
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    /**
     * Soumission :
     * - empêche le refresh navigateur
     * - reset l'erreur
     * - lance la requête d'inscription
     * - redirige vers /dashboard si OK
     * - sinon affiche un message générique (email déjà utilisé, etc.)
     */
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        try {
            // Appelle le backend via le hook (ex: POST /auth/register)
            await register(fullName, email, password);

            // Redirection après succès
            nav("/dashboard");
        } catch {
            // Message volontairement générique pour couvrir différents cas d'erreur
            setErr("Impossible de créer le compte (email déjà utilisé ?).");
        } finally {
            // On relâche l'UI dans tous les cas
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
                    {/* Formulaire d'inscription */}
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* Nom complet */}
                        <Input
                            label="Nom"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ton nom"
                            autoComplete="name"
                            required
                            disabled={loading}
                        />

                        {/* Email + validation HTML (type=email) */}
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

                        {/* Mot de passe */}
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

                        {/* Affichage erreur */}
                        {err ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {err}
                            </div>
                        ) : null}

                        {/* CTA principal */}
                        <Button disabled={loading} className="w-full">
                            {loading ? "Création..." : "Créer mon compte"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center">
                    {/* Lien vers la page de login */}
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
