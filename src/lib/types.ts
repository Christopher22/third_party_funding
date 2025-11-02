import { MonthYear } from "@/lib/month-year";

export interface Position {
    description: string;
    quantity: number;
    type: string;
    start: MonthYear;
    end: MonthYear;
}

export interface ProjectInput {
    name: string;
    start: MonthYear;
    end: MonthYear;
    funded?: boolean;
}

export interface Project extends ProjectInput {
    positions: Position[];
    funded: boolean;
}
