import { type Project } from "@/lib/types";
import { MonthYear } from "@/lib/month-year";

export function projectsToSerializable(projects: Project[]): unknown {
    return JSON.parse(
        JSON.stringify(projects, (_, value) =>
            value instanceof MonthYear ? value.toString() : value
        )
    );
}

function reviveMonthYear(val: unknown): MonthYear {
    if (val instanceof MonthYear) return val;
    if (typeof val === "string") return MonthYear.fromString(val);
    if (
        val &&
        typeof val === "object" &&
        "year" in val &&
        "month" in val
    ) {
        const v = val as { year: number; month: number };
        return new MonthYear(Number(v.year), Number(v.month));
    }
    throw new Error(`Invalid MonthYear: ${String(val)}`);
}

export function projectsFromSerializable(raw: unknown): Project[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (raw as any[]).map((proj) => ({
        ...proj,
        start: reviveMonthYear(proj.start),
        end: reviveMonthYear(proj.end),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        positions: (proj.positions || []).map((pos: any) => ({
            ...pos,
            start: reviveMonthYear(pos.start),
            end: reviveMonthYear(pos.end),
            quantity:
                typeof pos.quantity === "number"
                    ? pos.quantity
                    : Number(pos.quantity) || 0,
        })),
        funded: !!proj.funded, // Make sure it's boolean (default false if missing)
    }));
}

export function downloadStringAsFile(data: string, filename: string) {
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 0);
}