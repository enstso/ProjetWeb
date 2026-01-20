import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "soft";
};

export function Card({
                         variant = "default",
                         className = "",
                         ...props
                     }: CardProps) {
    const base =
        "rounded-2xl border shadow-sm transition bg-white";
    const styles =
        variant === "soft"
            ? "border-zinc-200 bg-zinc-50/70"
            : "border-zinc-200 bg-white";

    // un petit polish sympa (sans être agressif)
    const polish =
        "hover:shadow-md focus-within:ring-2 focus-within:ring-zinc-900/10";

    return <div className={[base, styles, polish, className].join(" ")} {...props} />;
}

type SectionProps = React.HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className = "", ...props }: SectionProps) {
    return <div className={["px-6 pt-6", className].join(" ")} {...props} />;
}

export function CardTitle({
                              className = "",
                              ...props
                          }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h2
            className={["text-xl font-semibold tracking-tight text-zinc-900", className].join(" ")}
            {...props}
        />
    );
}

export function CardDescription({
                                    className = "",
                                    ...props
                                }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={["mt-1 text-sm leading-relaxed text-zinc-600", className].join(" ")}
            {...props}
        />
    );
}

export function CardContent({ className = "", ...props }: SectionProps) {
    return <div className={["px-6 py-5", className].join(" ")} {...props} />;
}

export function CardFooter({ className = "", ...props }: SectionProps) {
    return (
        <div
            className={["px-6 pb-6 pt-0 flex items-center gap-3", className].join(" ")}
            {...props}
        />
    );
}
