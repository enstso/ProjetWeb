import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
    const base =
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition " +
        "focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const styles =
        variant === "primary"
            ? "!bg-zinc-900 !text-white hover:!bg-zinc-800 focus:ring-zinc-900"
            : "!bg-white !text-zinc-900 border border-zinc-200 hover:!bg-zinc-50 focus:ring-zinc-300";

    return <button className={[base, styles, className].join(" ")} {...props} />;
}
