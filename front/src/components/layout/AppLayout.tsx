import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function AppLayout() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
            <Navbar />
            <main className="mx-auto w-full max-w-5xl px-4 py-4">
                <Outlet />
            </main>
        </div>
    );
}
