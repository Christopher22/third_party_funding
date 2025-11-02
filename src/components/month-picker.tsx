import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ChevronDownIcon } from "lucide-react";

import { MonthYear } from "@/lib/month-year";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type MonthPickerProps = {
    label?: string;
    value: MonthYear;
    onChange: (v: MonthYear) => void;
    id?: string;
};

export function MonthPicker({
    label,
    value,
    onChange,
    id = "month",
}: MonthPickerProps) {
    const [open, setOpen] = useState(false);
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <Label htmlFor={id} className="px-1">
                    {label}
                </Label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id={id}
                        className="w-full justify-between font-normal"
                        type="button"
                    >
                        {value.toShortString()}
                        <ChevronDownIcon size={18} className="ml-2" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value.toDate()}
                        captionLayout="dropdown"
                        defaultMonth={value.toDate()}
                        onSelect={(date) => {
                            if (date) {
                                onChange(MonthYear.fromDate(date));
                                setOpen(false);
                            }
                        }}
                        startMonth={new Date(new Date().getFullYear() - 6, 0, 1)}
                        endMonth={new Date(new Date().getFullYear() + 6, 11, 31)}
                        showOutsideDays={false}
                        required
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}