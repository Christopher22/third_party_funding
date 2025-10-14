import React, {
  useMemo,
  useState,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from "react";

import {
  CalendarDays,
  PlusCircle,
  Save,
  UploadCloud,
  Clock,
  UserPlus,
  Pencil,
  Trash2,
  Tag,
  Hash,
  FolderPlus,
  ChevronDownIcon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

// --- MONTH+YEAR CLASS ---

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

// --- TYPES ---

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
}

export interface Project extends ProjectInput {
  positions: Position[];
}

// --- SERIALIZATION HELPERS ---
function projectsToSerializable(projects: Project[]): unknown {
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

function projectsFromSerializable(raw: unknown): Project[] {
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
  }));
}

function downloadStringAsFile(data: string, filename: string) {
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

// --- MONTH PICKER COMPONENT ---

type MonthPickerProps = {
  label?: string;
  value: MonthYear;
  onChange: (v: MonthYear) => void;
  id?: string;
};

function MonthPicker({
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

// --- ADD DIALOGS ---

function AddProjectDialog({
  open,
  onOpenChange,
  newProject,
  setNewProject,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  newProject: ProjectInput;
  setNewProject: (v: ProjectInput) => void;
  onAdd: (e: FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="default"
          className="ml-2"
          onClick={() => onOpenChange(true)}
        >
          <PlusCircle className="mr-1" size={18} />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FolderPlus className="inline mb-1 mr-2" size={20} />
            Add new project
          </DialogTitle>
          <DialogDescription>
            Set project name and schedule.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onAdd} autoComplete="off">
          <Input
            autoFocus
            required
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject({ ...newProject, name: e.target.value })
            }
          />
          <div className="flex gap-2">
            <MonthPicker
              label="Start"
              value={newProject.start}
              onChange={(start) =>
                setNewProject({
                  ...newProject,
                  start,
                  end: newProject.end.isBefore(start)
                    ? start
                    : newProject.end,
                })
              }
              id="proj-add-start"
            />
            <MonthPicker
              label="End"
              value={newProject.end}
              onChange={(end) =>
                setNewProject({
                  ...newProject,
                  end: end.isBefore(newProject.start)
                    ? newProject.start
                    : end,
                })
              }
              id="proj-add-end"
            />
          </div>
          <DialogFooter>
            <Button type="submit">
              <PlusCircle size={16} className="mr-1" />
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

function AddPositionDialog({
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

// --- EDIT SHEET STATE & SHEET ---

type EditSheetState =
  | { type: "project"; projectIdx: number; values: ProjectInput }
  | {
    type: "position";
    projectIdx: number;
    positionIdx: number;
    values: Position;
  }
  | null;

function EditSheet({
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

// --- PROJECT TABLE ---

interface ProjectTableProps {
  projects: Project[];
  months: MonthYear[];
  allTypes: string[];
  sumPerTypePerMonth: Record<string, number>;
  onProjectClick: (pidx: number) => void;
  onPositionClick: (pidx: number, posIdx: number) => void;
  onAddPositionClick: (pidx: number) => void;
  selectedProjectIdx: number | null;
  selectedPositionIdx: number | null;
}

function ProjectTable({
  projects,
  months,
  allTypes,
  sumPerTypePerMonth,
  onProjectClick,
  onPositionClick,
  onAddPositionClick,
  selectedProjectIdx,
  selectedPositionIdx,
}: ProjectTableProps) {
  return (
    <div className="overflow-x-auto w-full">
      <Table className="w-full">
        <TableCaption>
          <CalendarDays className="inline mb-1 mr-2" size={17} />
          Project positions by month, type and project.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">
              <Clock className="mb-0.5 mr-1 inline" size={15} />
              Month
            </TableHead>
            {projects.map((project, pIdx) => (
              <TableHead key={pIdx}>
                <Item>
                  <ItemContent>
                    <ItemTitle>
                      <Button
                        variant={
                          selectedProjectIdx === pIdx &&
                            selectedPositionIdx == null
                            ? "outline"
                            : "ghost"
                        }
                        size="sm"
                        onClick={() => onProjectClick(pIdx)}
                        type="button"
                      >
                        {project.name}
                      </Button>
                    </ItemTitle>
                    <ItemDescription>
                      {project.start.toShortString()} -{" "}
                      {project.end.toShortString()}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      onClick={() => onAddPositionClick(pIdx)}
                      className="mt-2"
                      size="sm"
                      variant="secondary"
                      type="button"
                    >
                      <UserPlus size={15} className="mr-1" />
                      Position
                    </Button>
                  </ItemActions>
                </Item>
              </TableHead>
            ))}
            <TableHead className="text-center min-w-[130px]">
              <Tag className="mb-0.5 mr-1 inline" size={15} />
              Sum per type
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month, mIdx) => (
            <Tooltip key={month.toString()}>
              <TooltipTrigger asChild>
                <TableRow key={month.toString()}>
                  <TableCell className="text-center font-semibold">
                    <Clock size={14} className="inline mb-1 mr-1" />
                    {month.toShortString()}
                  </TableCell>
                  {projects.map((project, pIdx) => (
                    <TableCell key={pIdx} className="align-top">
                      <div className="flex flex-col gap-y-1">
                        {project.positions.map(
                          (pos, posIdx) =>
                            month.isWithin(pos.start, pos.end) && (
                              <Button
                                key={posIdx}
                                variant={
                                  selectedProjectIdx === pIdx &&
                                    selectedPositionIdx === posIdx
                                    ? "outline"
                                    : "ghost"
                                }
                                size="sm"
                                className="w-full justify-start"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPositionClick(pIdx, posIdx);
                                }}
                                type="button"
                              >
                                <Tag size={14} className="mr-1" />
                                <span className="mr-2">{pos.type}</span>
                                <Hash size={13} className="ml-1 mr-1" />
                                <span className="text-xs text-muted-foreground mr-1">
                                  {pos.quantity}
                                </span>
                              </Button>
                            )
                        )}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="align-top">
                    {allTypes.map((type, tIdx) => {
                      const sum =
                        sumPerTypePerMonth[`${tIdx}_${mIdx}`] || 0;
                      return (
                        <div
                          key={type}
                          className="flex justify-between items-center"
                        >
                          <Tag
                            className="text-muted-foreground text-xs mr-1"
                            size={11}
                          />
                          <span className="text-muted-foreground text-xs">
                            {type}
                          </span>
                          <span
                            className={
                              "ml-2 " +
                              (sum ? "font-semibold" : "opacity-40")
                            }
                          >
                            {sum.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </TableCell>
                </TableRow>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                {month.toDate().toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </TooltipContent>
            </Tooltip>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- MAIN COMPONENT ---

export const ProjectGantt: React.FC<{ initialProjects: Project[] }> = ({
  initialProjects,
}) => {

  function loadData(data: unknown): MonthYear {
    if (data instanceof MonthYear) {
      return data;
    } else if (typeof data === "string") {
      return MonthYear.fromString(data);
    } else if (data && typeof data === "object" && "year" in data && "month" in data) {
      return new MonthYear((data as { year: number; month: number }).year, (data as { year: number; month: number }).month);
    } else {
      throw new Error("Invalid MonthYear data");
    }
  }

  const fixDates = (proj: Project): Project => ({
    ...proj,
    start: loadData(proj.start),
    end: loadData(proj.end),
    positions: proj.positions.map((pos) => ({
      ...pos,
      start: loadData(pos.start),
      end: loadData(pos.end),
      quantity: typeof pos.quantity === "number" ? pos.quantity : Number(pos.quantity) || 0,
    })),
  });

  const [projects, setProjects] = useState<Project[]>(
    initialProjects.map(fixDates)
  );

  const [sheet, setSheet] = useState<EditSheetState>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const defaultMonth = MonthYear.today();
  const defaultEnd = defaultMonth.addMonths(5);
  const defaultNewProject: ProjectInput = {
    name: "",
    start: defaultMonth,
    end: defaultEnd,
  };
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState<ProjectInput>(
    defaultNewProject
  );

  const makeDefaultNewPosition = (
    start: MonthYear,
    end: MonthYear
  ): Position => ({
    description: "",
    quantity: 1,
    type: "",
    start,
    end,
  });
  const [addPositionOpen, setAddPositionOpen] = useState(false);
  const [addPosProjectIdx, setAddPosProjectIdx] = useState<number | null>(
    null
  );
  const [newPosition, setNewPosition] = useState<Position>(
    makeDefaultNewPosition(defaultMonth, defaultEnd)
  );
  const [onlyFuture, setOnlyFuture] = useState(true);

  const today = MonthYear.today();
  const months = useMemo(() => {
    if (projects.length === 0) return [];
    let minYM = projects[0].start;
    let maxYM = projects[0].end;
    for (const p of projects) {
      if (p.start.isBefore(minYM)) minYM = p.start;
      if (p.end.isAfter(maxYM)) maxYM = p.end;
    }
    if (onlyFuture && today.isAfter(minYM)) {
      minYM = today;
    }
    const arr: MonthYear[] = [];
    for (
      let ym = minYM;
      !ym.isAfter(maxYM);
      ym = ym.addMonths(1)
    )
      arr.push(ym);
    return arr;
  }, [projects, onlyFuture, today]);

  const allTypes = useMemo(
    () =>
      Array.from(
        new Set(
          projects.flatMap((p) => p.positions.map((pos) => pos.type))
        )
      ),
    [projects]
  );

  const typeIndex = useMemo(() => {
    return new Map<string, number>(
      allTypes.map((type, i) => [type, i])
    );
  }, [allTypes]);

  const sumPerTypePerMonth = useMemo(() => {
    const result: Record<string, number> = {};
    months.forEach((month, mIdx) => {
      projects.forEach((project) => {
        project.positions.forEach((pos) => {
          if (month.isWithin(pos.start, pos.end)) {
            const tIdx = typeIndex.get(pos.type);
            if (tIdx === undefined) return;
            const key = `${tIdx}_${mIdx}`;
            result[key] = (result[key] || 0) + pos.quantity;
          }
        });
      });
    });
    return result;
  }, [projects, months, typeIndex]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSaveProjects() {
    const serializable = projectsToSerializable(projects);
    const jsonStr = JSON.stringify(serializable, null, 2);
    downloadStringAsFile(
      jsonStr,
      `projects-${new Date().toISOString().slice(0, 10)}.json`
    );
  }

  function handleLoadProjects(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        setProjects(projectsFromSerializable(raw));
        setSheet(null);
        setEditSheetOpen(false);
      } catch (err) {
        alert("Failed to load projects: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function openProjectSheet(projectIdx: number) {
    const p = projects[projectIdx];
    setSheet({
      type: "project",
      projectIdx,
      values: {
        name: p.name,
        start: p.start,
        end: p.end,
      },
    });
    setEditSheetOpen(true);
  }
  function openPositionSheet(projectIdx: number, positionIdx: number) {
    const pos = projects[projectIdx].positions[positionIdx];
    setSheet({
      type: "position",
      projectIdx,
      positionIdx,
      values: { ...pos },
    });
    setEditSheetOpen(true);
  }

  function closeEditSheet() {
    setEditSheetOpen(false);
    setSheet(null);
  }
  function saveSheetEdit() {
    if (!sheet) return closeEditSheet();
    if (sheet.type === "project") {
      setProjects((projs) =>
        projs.map((p, idx) =>
          idx === sheet.projectIdx
            ? {
              ...p,
              name: sheet.values.name,
              start: sheet.values.start,
              end: sheet.values.end,
            }
            : p
        )
      );
    } else {
      setProjects((projs) =>
        projs.map((p, idx) =>
          idx === sheet.projectIdx
            ? {
              ...p,
              positions: p.positions.map((pos, posIdx) =>
                posIdx === sheet.positionIdx
                  ? { ...sheet.values }
                  : pos
              ),
            }
            : p
        )
      );
    }
    closeEditSheet();
  }
  function deleteSheetEdit() {
    if (!sheet) return closeEditSheet();
    if (sheet.type === "project") {
      if (window.confirm("Delete project?")) {
        setProjects((projs) =>
          projs.filter((_, idx) => idx !== sheet.projectIdx)
        );
        closeEditSheet();
      }
    } else {
      if (window.confirm("Delete position?")) {
        setProjects((projs) =>
          projs.map((p, idx) =>
            idx === sheet.projectIdx
              ? {
                ...p,
                positions: p.positions.filter(
                  (_, posIdx) => posIdx !== sheet.positionIdx
                ),
              }
              : p
          )
        );
        closeEditSheet();
      }
    }
  }

  function handleAddProject(ev: FormEvent) {
    ev.preventDefault();
    const { name, start, end } = newProject;
    if (!name.trim()) return;
    setProjects([
      ...projects,
      { name: name.trim(), start, end, positions: [] },
    ]);
    setAddProjectOpen(false);
    setNewProject(defaultNewProject);
  }
  function handleAddPositionSubmit(e: FormEvent) {
    e.preventDefault();
    if (addPosProjectIdx == null) return;
    const { description, type, quantity, start, end } = newPosition;
    if (!description.trim() || !type.trim() || quantity < 0) return;
    setProjects(
      projects.map((p, idx) =>
        idx === addPosProjectIdx
          ? {
            ...p,
            positions: [
              ...p.positions,
              { description, quantity, type, start, end },
            ],
          }
          : p
      )
    );
    setAddPositionOpen(false);
    setNewPosition(
      makeDefaultNewPosition(
        projects[addPosProjectIdx].start,
        projects[addPosProjectIdx].end
      )
    );
  }
  function handleAddPositionClick(pidx: number) {
    setAddPosProjectIdx(pidx);
    setAddPositionOpen(true);
    setNewPosition(
      makeDefaultNewPosition(
        projects[pidx].start,
        projects[pidx].end
      )
    );
  }

  const selectedProjectIdx =
    sheet &&
      (sheet.type === "project" || sheet.type === "position")
      ? sheet.projectIdx
      : null;
  const selectedPositionIdx =
    sheet && sheet.type === "position" ? sheet.positionIdx : null;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold flex items-center">
          <CalendarDays className="mb-0.5 mr-2" size={23} />
          Projects Timeline
        </h2>
        <AddProjectDialog
          open={addProjectOpen}
          onOpenChange={setAddProjectOpen}
          newProject={newProject}
          setNewProject={setNewProject}
          onAdd={handleAddProject}
        />
        <Button size="sm" variant="secondary" onClick={handleSaveProjects}>
          <Save size={16} className="mr-1" />
          Save projects
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleLoadProjects}
        />
        <Button
          asChild
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <span>
            <UploadCloud className="mb-0.5 mr-1" size={16} />
            Load projects
          </span>
        </Button>
        <div className="flex items-center gap-2 ml-4">
          <Switch
            checked={onlyFuture}
            onCheckedChange={setOnlyFuture}
            id="future-months-switch"
          />
          <label
            htmlFor="future-months-switch"
            className="ml-1 flex items-center"
          >
            <Clock size={15} className="mr-1 mb-0.5" />
            Show only current and future months
          </label>
        </div>
      </div>
      <ProjectTable
        projects={projects}
        months={months}
        allTypes={allTypes}
        sumPerTypePerMonth={sumPerTypePerMonth}
        onProjectClick={openProjectSheet}
        onPositionClick={openPositionSheet}
        onAddPositionClick={handleAddPositionClick}
        selectedProjectIdx={selectedProjectIdx}
        selectedPositionIdx={selectedPositionIdx}
      />
      <AddPositionDialog
        open={addPositionOpen}
        onOpenChange={setAddPositionOpen}
        newPosition={newPosition}
        setNewPosition={setNewPosition}
        onAdd={handleAddPositionSubmit}
        allTypes={allTypes}
      />
      <EditSheet
        open={editSheetOpen}
        onOpenChange={(open) => {
          if (!open) closeEditSheet();
        }}
        sheet={sheet}
        setSheet={setSheet}
        onSave={saveSheetEdit}
        onDelete={deleteSheetEdit}
        allTypes={allTypes}
      />
    </div>
  );
};