import {
    type FormEvent,
} from "react";

import {
    UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { MonthPicker } from "@/components/month-picker";
import type { Position } from "@/lib/types";

export function AddPositionDialog({
    open,
    onOpenChange,
    newPosition,
    setNewPosition,
    onAdd,
    allTypes,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    newPosition: Position;
    setNewPosition: (v: Position) => void;
    onAdd: (e: FormEvent) => void;
    allTypes: string[];
}) {
    const quantityString =
        newPosition.quantity === 0 && typeof newPosition.quantity !== "string"
            ? ""
            : String(newPosition.quantity);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        <UserPlus className="inline mb-1 mr-2" size={19} />
                        Add position
                    </DialogTitle>
                    <DialogDescription>
                        Enter details for the position.
                    </DialogDescription>
                </DialogHeader>
                <form className="space-y-3" autoComplete="off" onSubmit={onAdd}>
                    <Input
                        autoFocus
                        required
                        placeholder="Description"
                        value={newPosition.description}
                        onChange={(e) =>
                            setNewPosition({
                                ...newPosition,
                                description: e.target.value,
                            })
                        }
                    />
                    <Input
                        required
                        placeholder="Type"
                        list="position-type-list"
                        value={newPosition.type}
                        onChange={(e) =>
                            setNewPosition({
                                ...newPosition,
                                type: e.target.value,
                            })
                        }
                    />
                    <datalist id="position-type-list">
                        {allTypes.map((type) => (
                            <option key={type} value={type} />
                        ))}
                    </datalist>
                    <Input
                        type="number"
                        min={0}
                        step={0.01}
                        required
                        placeholder="Quantity"
                        value={quantityString}
                        onChange={(e) => {
                            const v = e.target.value;
                            setNewPosition({
                                ...newPosition,
                                quantity: v === "" ? 0 : Number(v),
                            });
                        }}
                    />
                    <div className="flex gap-2">
                        <MonthPicker
                            label="From"
                            value={newPosition.start}
                            onChange={(start) =>
                                setNewPosition({
                                    ...newPosition,
                                    start,
                                    end: newPosition.end.isBefore(start)
                                        ? start
                                        : newPosition.end,
                                })
                            }
                            id="pos-add-start"
                        />
                        <MonthPicker
                            label="To"
                            value={newPosition.end}
                            onChange={(end) =>
                                setNewPosition({
                                    ...newPosition,
                                    end: end.isBefore(newPosition.start)
                                        ? newPosition.start
                                        : end,
                                })
                            }
                            id="pos-add-end"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">
                            <UserPlus size={15} className="mr-1" />
                            Add
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}