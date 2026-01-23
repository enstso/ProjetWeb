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
    /**
     * useAuth :
     * - user : utilisateur courant (chargé via /me)
     * - updateProfile : PUT /me pour modifier fullName / email
     */
    const { user, updateProfile } = useAuth();

    /**
     * Navigation (React Router)
     * - utilisé ici pour revenir au dashboard
     */
    const navigate = useNavigate();

    /**
     * Champs du formulaire (controlled inputs)
     */
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");

    /**
     * UI state :
     * - loading : bloque le formulaire pendant la requête
     * - msg : message de succès
     * - err : message d'erreur à afficher
     */
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    /**
     * Synchronise le formulaire avec l'utilisateur courant.
     * À chaque changement de `user`, on pré-remplit les champs.
     */
    useEffect(() => {
        setFullName(user?.fullName ?? "");
        setEmail(user?.email ?? "");
    }, [user]);

    /**
     * Soumission :
     * - empêche le refresh navigateur
     * - reset les messages
     * - met en loading
     * - tente d'update le profil via l'API
     * - affiche un message succès ou erreur
     */
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setErr(null);
        setLoading(true);

        try {
            // Appelle le backend (PUT /me) via le hook
            await updateProfile({ fullName, email });

            // Feedback UX
            setMsg("Profil mis à jour ✅");
        } catch (e) {
            // Axios: e.response?.data?.message (si le backend renvoie un message)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setErr(e?.response?.data?.message ?? "Impossible de mettre à jour le profil.");
        } finally {
            // On relâche le formulaire dans tous les cas
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white p-4">
            <div className="mx-auto w-full max-w-md">
                <Card className="overflow-hidden">
                    {/* Bandeau décoratif */}
                    <div className="h-20 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700" />

                    <CardHeader>
                        <CardTitle>Mon profil</CardTitle>
                        <CardDescription>Consulte et modifie tes informations.</CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* Formulaire controlled + submit */}
                        <form onSubmit={onSubmit} className="space-y-4">
                            {/* Nom (optionnel côté UI) */}
                            <Input
                                label="Nom"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Ton nom"
                                disabled={loading}
                            />

                            {/* Email requis + validation HTML (type=email) */}
                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="toi@mail.com"
                                disabled={loading}
                                required
                            />

                            {/* Message succès */}
                            {msg ? (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                    {msg}
                                </div>
                            ) : null}

                            {/* Message erreur */}
                            {err ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {err}
                                </div>
                            ) : null}

                            {/* CTA principal */}
                            <Button variant={"primary"} className="w-full" disabled={loading}>
                                {loading ? "Sauvegarde..." : "Sauvegarder"}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex-col gap-2">
                        {/* Navigation secondaire */}
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
