export class MonthYear {
    year: number;
    month: number;

    constructor(year: number, month: number) {
        if (month < 1 || month > 12)
            throw new Error(`Invalid month: ${month}`);
        this.year = year;
        this.month = month;
    }

    static fromString(str: string): MonthYear {
        const match = /^(\d{4})-(\d{2})$/.exec(str);
        if (!match) throw new Error(`Invalid MonthYear string: ${str}`);
        return new MonthYear(Number(match[1]), Number(match[2]));
    }

    static fromDate(date: Date): MonthYear {
        return new MonthYear(date.getFullYear(), date.getMonth() + 1);
    }

    static today(): MonthYear {
        return MonthYear.fromDate(new Date());
    }

    toString(): string {
        return `${this.year}-${this.month.toString().padStart(2, "0")}`;
    }

    equals(other: MonthYear): boolean {
        return this.year === other.year && this.month === other.month;
    }

    isBefore(other: MonthYear): boolean {
        return (
            this.year < other.year ||
            (this.year === other.year && this.month < other.month)
        );
    }

    isAfter(other: MonthYear): boolean {
        return (
            this.year > other.year ||
            (this.year === other.year && this.month > other.month)
        );
    }

    isWithin(start: MonthYear, end: MonthYear): boolean {
        return !this.isBefore(start) && !this.isAfter(end);
    }

    addMonths(count: number): MonthYear {
        const totalMonths = this.year * 12 + this.month - 1 + count;
        const year = Math.floor(totalMonths / 12);
        const month = (totalMonths % 12) + 1;
        return new MonthYear(year, month);
    }

    toDate(): Date {
        return new Date(this.year, this.month - 1, 1);
    }

    toShortString(): string {
        return this.toDate().toLocaleString("default", {
            month: "short",
            year: "2-digit",
        });
    }
}