import React from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
    label: string;
    error?: string;
};

export function Input({ label, error, className = "", id, ...props }: Props) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const inputId = id ?? React.useId();

    return (
        <div className="space-y-1.5">
            <label htmlFor={inputId} className="text-sm font-medium text-zinc-800">
                {label}
            </label>

            <input
                id={inputId}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : undefined}
                className={[
                    "w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm",
                    "placeholder:text-zinc-400",
                    "focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-300",
                    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-zinc-50",
                    error ? "border-red-400 focus:ring-red-500/20 focus:border-red-400" : "border-zinc-200",
                    className,
                ].join(" ")}
                {...props}
            />

            {error ? (
                <p id={`${inputId}-error`} className="text-xs text-red-600">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
