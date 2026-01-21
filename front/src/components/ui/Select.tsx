import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    error?: string;
};

export function Select({ label, error, className = "", id, children, ...props }: Props) {
    const selectId = id ?? React.useId();

    return (
        <div className="space-y-1.5">
            <label htmlFor={selectId} className="text-sm font-medium text-zinc-800">
                {label}
            </label>

            <select
                id={selectId}
                aria-invalid={!!error}
                aria-describedby={error ? `${selectId}-error` : undefined}
                className={[
                    "w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-300",
                    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-zinc-50",
                    error ? "border-red-400 focus:ring-red-500/20 focus:border-red-400" : "border-zinc-200",
                    className,
                ].join(" ")}
                {...props}
            >
                {children}
            </select>

            {error ? (
                <p id={`${selectId}-error`} className="text-xs text-red-600">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
