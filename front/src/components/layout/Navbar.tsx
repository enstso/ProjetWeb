import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

function navLinkClass({ isActive }: { isActive: boolean }) {
    const base =
        "rounded-xl px-3 py-2 text-sm font-semibold transition";
    return isActive
        ? `${base} bg-zinc-900 text-white`
        : `${base} text-zinc-700 hover:bg-zinc-100`;
}

export function Navbar() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    const [open, setOpen] = useState(false);

    const emailShort = useMemo(() => {
        const e = user?.email ?? "";
        if (!e) return "";
        return e.length > 22 ? e.slice(0, 10) + "…" + e.slice(-8) : e;
    }, [user?.email]);

    function onLogout() {
        logout();
        nav("/login");
    }

    return (
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
                {/* Brand */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-black text-zinc-900">
                        H
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-semibold text-zinc-900">HabitGoals</p>
                        <p className="text-xs text-zinc-600">objectifs & habitudes</p>
                    </div>
                </div>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-2 md:flex">
                    <NavLink to="/dashboard" className={navLinkClass}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/goals" className={navLinkClass}>
                        Objectifs
                    </NavLink>
                    <NavLink to="/habits" className={navLinkClass}>
                        Habitudes
                    </NavLink>
                    <NavLink to="/profile" className={navLinkClass}>
                        Profil
                    </NavLink>
                </nav>

                {/* Right */}
                <div className="flex items-center gap-2">
                    <div className="hidden md:block">
            <span className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700">
              {emailShort}
            </span>
                    </div>

                    <Button variant="secondary" className="hidden md:inline-flex" onClick={onLogout}>
                        Déconnexion
                    </Button>

                    {/* Mobile burger */}
                    <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-800 md:hidden"
                        onClick={() => setOpen((v) => !v)}
                        aria-label="Menu"
                    >
                        {open ? "✕" : "☰"}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {open ? (
                <div className="md:hidden">
                    <div className="mx-auto w-full max-w-5xl px-4 pb-3">
                        <div className="rounded-2xl border border-zinc-200 bg-white p-2">
                            <div className="px-2 pb-2">
                                <p className="text-xs text-zinc-500">Connecté :</p>
                                <p className="text-sm font-semibold text-zinc-900">{user?.email}</p>
                            </div>

                            <div className="flex flex-col gap-1">
                                <NavLink to="/dashboard" className={navLinkClass} onClick={() => setOpen(false)}>
                                    Dashboard
                                </NavLink>
                                <NavLink to="/goals" className={navLinkClass} onClick={() => setOpen(false)}>
                                    Objectifs
                                </NavLink>
                                <NavLink to="/habits" className={navLinkClass} onClick={() => setOpen(false)}>
                                    Habitudes
                                </NavLink>
                                <NavLink to="/profile" className={navLinkClass} onClick={() => setOpen(false)}>
                                    Profil
                                </NavLink>

                                <div className="pt-2">
                                    <Button variant="secondary" className="w-full" onClick={onLogout}>
                                        Déconnexion
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
