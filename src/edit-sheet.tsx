import {
    Save,
    Pencil,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

import { MonthPicker } from "@/components/month-picker";
import type { ProjectInput, Position } from "@/lib/types";

export type EditSheetState =
    | { type: "project"; projectIdx: number; values: ProjectInput }
    | {
        type: "position";
        projectIdx: number;
        positionIdx: number;
        values: Position;
    }
    | null;

export function EditSheet({
    open,
    onOpenChange,
    sheet,
    setSheet,
    onSave,
    onDelete,
    allTypes,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sheet: EditSheetState;
    setSheet: (sheet: EditSheetState) => void;
    onSave: () => void;
    onDelete: () => void;
    allTypes: string[];
}) {
    if (!sheet) return null;
    const idPrefix = sheet.type === "project" ? "project-edit-" : "pos-edit-";
    const quantityString =
        sheet.type === "position"
            ? sheet.values.quantity === 0 && typeof sheet.values.quantity !== "string"
                ? ""
                : String(sheet.values.quantity)
            : "";
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>
                        <Pencil size={20} className="mb-1 mr-2 inline" />
                        {sheet.type === "project"
                            ? "Edit Project"
                            : "Edit Position"}
                    </SheetTitle>
                    <SheetDescription>
                        {sheet.type === "project"
                            ? "Edit the project details below."
                            : "Edit the position details below."}
                    </SheetDescription>
                </SheetHeader>
                <div className="grid flex-1 auto-rows-min gap-6 px-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSave();
                        }}
                    >
                        <FieldGroup>
                            <FieldSet>
                                <FieldLegend>
                                    {sheet.type === "project"
                                        ? "Project Details"
                                        : "Position Details"}
                                </FieldLegend>
                                <FieldGroup>
                                    {sheet.type === "project" ? (
                                        <>
                                            <Field>
                                                <FieldLabel htmlFor={idPrefix + "name"}>
                                                    Name
                                                </FieldLabel>
                                                <Input
                                                    id={idPrefix + "name"}
                                                    type="text"
                                                    required
                                                    value={sheet.values.name}
                                                    onChange={(e) =>
                                                        setSheet({
                                                            ...sheet,
                                                            values: {
                                                                ...sheet.values,
                                                                name: e.target.value,
                                                            },
                                                        })
                                                    }
                                                />
                                            </Field>
                                            <div className="grid gap-4">
                                                <Field>
                                                    <FieldLabel htmlFor={idPrefix + "start"}>
                                                        Start
                                                    </FieldLabel>
                                                    <MonthPicker
                                                        value={sheet.values.start}
                                                        id={idPrefix + "start"}
                                                        onChange={(start) =>
                                                            setSheet({
                                                                ...sheet,
                                                                values: {
                                                                    ...sheet.values,
                                                                    start,
                                                                    end: sheet.values.end.isBefore(start)
                                                                        ? start
                                                                        : sheet.values.end,
                                                                },
                                                            })
                                                        }
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldLabel htmlFor={idPrefix + "end"}>
                                                        End
                                                    </FieldLabel>
                                                    <MonthPicker
                                                        value={sheet.values.end}
                                                        id={idPrefix + "end"}
                                                        onChange={(end) =>
                                                            setSheet({
                                                                ...sheet,
                                                                values: {
                                                                    ...sheet.values,
                                                                    end: end.isBefore(sheet.values.start)
                                                                        ? sheet.values.start
                                                                        : end,
                                                                },
                                                            })
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Switch
                                                    id={idPrefix + "funded"}
                                                    checked={!!sheet.values.funded}
                                                    onCheckedChange={funded =>
                                                        setSheet({
                                                            ...sheet,
                                                            values: {
                                                                ...sheet.values,
                                                                funded: funded,
                                                            },
                                                        })
                                                    }
                                                />
                                                <label htmlFor={idPrefix + "funded"} className="ml-1">
                                                    Funded
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Field>
                                                <FieldLabel htmlFor={idPrefix + "description"}>
                                                    Description
                                                </FieldLabel>
                                                <Input
                                                    id={idPrefix + "description"}
                                                    type="text"
                                                    required
                                                    value={sheet.values.description}
                                                    onChange={(e) =>
                                                        setSheet({
                                                            ...sheet,
                                                            values: {
                                                                ...sheet.values,
                                                                description: e.target.value,
                                                            },
                                                        })
                                                    }
                                                />
                                            </Field>
                                            <div className="grid gap-4">
                                                <Field>
                                                    <FieldLabel htmlFor={idPrefix + "type"}>
                                                        Type
                                                    </FieldLabel>
                                                    <Input
                                                        id={idPrefix + "type"}
                                                        type="text"
                                                        required
                                                        list="position-type-list"
                                                        value={sheet.values.type}
                                                        onChange={(e) =>
                                                            setSheet({
                                                                ...sheet,
                                                                values: {
                                                                    ...sheet.values,
                                                                    type: e.target.value,
                                                                },
                                                            })
                                                        }
                                                    />
                                                    <datalist id="position-type-list">
                                                        {allTypes.map((type) => (
                                                            <option key={type} value={type} />
                                                        ))}
                                                    </datalist>
                                                </Field>
                                                <Field>
                                                    <FieldLabel htmlFor={idPrefix + "quantity"}>
                                                        Quantity
                                                    </FieldLabel>
                                                    <Input
                                                        id={idPrefix + "quantity"}
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        required
                                                        value={quantityString}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setSheet({
                                                                ...sheet,
                                                                values: {
                                                                    ...sheet.values,
                                                                    quantity: v === "" ? 0 : Number(v),
                                                                },
                                                            });
                                                        }}
                                                    />
                                                </Field>
                                            </div>
                                            <div className="grid gap-4">
                                                <Field>
                                                    <FieldLabel htmlFor={idPrefix + "start"}>
                                                        Start
                                                    </FieldLabel>
                                                    <MonthPicker
                                                        value={sheet.values.start}
                                                        id={idPrefix + "start"}
                                                        onChange={(start) =>
                                                            setSheet({
                                                                ...sheet,
                                                                values: {
                                                                    ...sheet.values,
                                                                    start,
                                                                    end: sheet.values.end.isBefore(start)
                                                                        ? start
                                                                        : sheet.values.end,
                                                                },
                                                            })
                                                        }
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldLabel htmlFor={idPrefix + "end"}>
                                                        End
                                                    </FieldLabel>
                                                    <MonthPicker
                                                        value={sheet.values.end}
                                                        id={idPrefix + "end"}
                                                        onChange={(end) =>
                                                            setSheet({
                                                                ...sheet,
                                                                values: {
                                                                    ...sheet.values,
                                                                    end: end.isBefore(sheet.values.start)
                                                                        ? sheet.values.start
                                                                        : end,
                                                                },
                                                            })
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                        </>
                                    )}
                                </FieldGroup>
                            </FieldSet>
                            <SheetFooter>
                                <Button type="submit">
                                    <Save className="mr-1" size={15} />
                                    Save changes
                                </Button>
                                <Button
                                    variant="destructive"
                                    type="button"
                                    onClick={onDelete}
                                    className="ml-2"
                                >
                                    <Trash2 size={16} className="mb-0.5 mr-1" />
                                    {sheet.type === "project"
                                        ? "Delete Project"
                                        : "Delete Position"}
                                </Button>
                            </SheetFooter>
                        </FieldGroup>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}