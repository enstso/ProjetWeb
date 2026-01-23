import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
    /**
     * Hook d'authentification :
     * - login(email, password) : appelle l'API /auth/login puis stocke le token et recharge /me
     */
    const { login } = useAuth();

    /**
     * Navigateur React Router :
     * - nav("/dashboard") après connexion réussie
     */
    const nav = useNavigate();

    /**
     * Champs du formulaire
     */
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    /**
     * UI state :
     * - err : message d'erreur affiché si login échoue
     * - loading : désactive inputs/bouton pendant la requête
     */
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    /**
     * Soumission du formulaire :
     * - empêche le refresh de page
     * - reset l'erreur
     * - passe en mode loading
     * - tente le login
     * - redirige vers /dashboard si OK
     * - affiche un message générique si erreur (sécurité + UX)
     */
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        try {
            // Appel API + gestion token effectués dans useAuth.login
            await login(email, password);

            // Navigation vers le dashboard après succès
            nav("/dashboard");
        } catch (e) {
            // Log console utile en dev, sans exposer le détail à l'utilisateur
            console.error(e);

            // Message user-friendly (et volontairement générique)
            setErr("Email ou mot de passe incorrect.");
        } finally {
            // On repasse l'UI en état normal dans tous les cas
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full bg-zinc-50 grid place-items-center p-4">
            {/* Card centrée, taille max md */}
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Connexion</CardTitle>
                    <CardDescription>Content de te revoir 👋</CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Formulaire contrôlé (state -> inputs) */}
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* Email */}
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
                            autoComplete="current-password"
                            required
                            disabled={loading}
                        />

                        {/* Message d’erreur (si login échoue) */}
                        {err ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {err}
                            </div>
                        ) : null}

                        {/* CTA principal */}
                        <Button disabled={loading} className="w-full">
                            {loading ? "Connexion..." : "Se connecter"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center">
                    {/* Lien vers la page d'inscription */}
                    <p className="text-sm text-zinc-600">
                        Pas de compte ?{" "}
                        <Link className="font-semibold text-zinc-900 underline underline-offset-4" to="/register">
                            Créer un compte
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
