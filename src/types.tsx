export interface Project {
    name: string;
    start: Date;
    end: Date;
    positions: Position[];
}

export interface Position {
    description: string;
    quantity: number;
    type: string;
    start: Date;
    end: Date;
}