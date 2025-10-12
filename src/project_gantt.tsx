import React, { useMemo, useState, type FormEvent } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
} from "@/components/ui/item"

// --- MONTH+YEAR CLASS ---

export class MonthYear {
  year: number;
  month: number; // 1-based (January = 1)
  constructor(year: number, month: number) {
    if (month < 1 || month > 12) throw new Error(`Invalid month: ${month}`);
    this.year = year;
    this.month = month;
  }
  static fromString(str: string): MonthYear {
    const match = /^(\d{4})-(\d{2})$/.exec(str);
    if (!match) throw new Error("Invalid MonthYear string");
    return new MonthYear(Number(match[1]), Number(match[2]));
  }
  static fromDate(date: Date): MonthYear {
    return new MonthYear(date.getFullYear(), date.getMonth() + 1);
  }
  static today(): MonthYear {
    return MonthYear.fromDate(new Date());
  }
  toString(): string {
    return `this.year−{this.year} - this.year−{this.month.toString().padStart(2, "0")}`;
  }
  equals(other: MonthYear): boolean {
    return this.year === other.year && this.month === other.month;
  }
  isBefore(other: MonthYear): boolean {
    return this.year < other.year || (this.year === other.year && this.month < other.month);
  }
  isAfter(other: MonthYear): boolean {
    return this.year > other.year || (this.year === other.year && this.month > other.month);
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
    // e.g. "Jan 24"
    return this.toDate().toLocaleString("default", { month: "short", year: "2-digit" });
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

// --- MONTH PICKER COMPONENT ---

type MonthPickerProps = {
  label?: string;
  value: MonthYear;
  onChange: (v: MonthYear) => void;
  id?: string;
};

function MonthPicker({ label, value, onChange, id = "month" }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      {label && <Label htmlFor={id} className="px-1">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className="w-full justify-between font-normal"
            type="button"
          >
            {value.toShortString()}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value.toDate()}
            captionLayout="dropdown"
            onSelect={date => {
              if (date) {
                onChange(MonthYear.fromDate(date));
                setOpen(false);
              }
            }}
            showOutsideDays={false}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// --- ADD DIALOGS ---

function AddProjectDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  newProject: ProjectInput;
  setNewProject: (v: ProjectInput) => void;
  onAdd: (e: FormEvent) => void;
}) {
  const { open, onOpenChange, newProject, setNewProject, onAdd } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="ml-2">+ Add Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new project</DialogTitle>
          <DialogDescription>Set project name and schedule.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onAdd} autoComplete="off">
          <Input autoFocus required placeholder="Project Name"
            value={newProject.name}
            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
          />
          <div className="flex gap-2">
            <MonthPicker
              label="Start"
              value={newProject.start}
              onChange={start => setNewProject({
                ...newProject,
                start,
                end: newProject.end.isBefore(start) ? start : newProject.end
              })}
              id="proj-add-start"
            />
            <MonthPicker
              label="End"
              value={newProject.end}
              onChange={end => setNewProject({
                ...newProject,
                end: end.isBefore(newProject.start) ? newProject.start : end
              })}
              id="proj-add-end"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add</Button>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPositionDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  newPosition: Position;
  setNewPosition: (v: Position) => void;
  onAdd: (e: FormEvent) => void;
  allTypes: string[];
}) {
  const { open, onOpenChange, newPosition, setNewPosition, onAdd, allTypes } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add position</DialogTitle>
          <DialogDescription>Enter details for the position.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" autoComplete="off" onSubmit={onAdd}>
          <Input autoFocus required placeholder="Description"
            value={newPosition.description}
            onChange={e => setNewPosition({ ...newPosition, description: e.target.value })}
          />
          <Input
            required
            placeholder="Type"
            list="position-type-list"
            value={newPosition.type}
            onChange={e => setNewPosition({ ...newPosition, type: e.target.value })}
          />
          <datalist id="position-type-list">
            {allTypes.map(type => <option key={type} value={type} />)}
          </datalist>
          <Input
            type="number"
            min={0}
            step={0.01}
            required
            placeholder="Quantity"
            value={newPosition.quantity}
            onChange={e => setNewPosition({
              ...newPosition,
              quantity: Number(e.target.value) || 0,
            })}
          />
          <div className="flex gap-2">
            <MonthPicker
              label="From"
              value={newPosition.start}
              onChange={start => setNewPosition({
                ...newPosition,
                start,
                end: newPosition.end.isBefore(start) ? start : newPosition.end
              })}
              id="pos-add-start"
            />
            <MonthPicker
              label="To"
              value={newPosition.end}
              onChange={end => setNewPosition({
                ...newPosition,
                end: end.isBefore(newPosition.start) ? newPosition.start : end
              })}
              id="pos-add-end"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add</Button>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- EDIT SHEET STATE & SHEET ---

type EditSheetState =
  | { type: "project", projectIdx: number, values: ProjectInput }
  | { type: "position", projectIdx: number, positionIdx: number, values: Position }
  | null;

function EditSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheet: EditSheetState;
  setSheet: (sheet: EditSheetState) => void;
  onSave: () => void;
  onDelete: () => void;
  allTypes: string[];
}) {
  const { open, onOpenChange, sheet, setSheet, onSave, onDelete, allTypes } = props;
  if (!sheet) return null;
  const idPrefix = sheet.type === "project" ? "project-edit-" : "pos-edit-";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{sheet.type === "project" ? "Edit Project" : "Edit Position"}</SheetTitle>
          <SheetDescription>
            {sheet.type === "project" ? "Edit the project details below." : "Edit the position details below."}
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <form onSubmit={e => { e.preventDefault(); onSave(); }}>
            <FieldGroup>
              <FieldSet>
                <FieldLegend>{sheet.type === "project" ? "Project Details" : "Position Details"}</FieldLegend>
                <FieldGroup>
                  {sheet.type === "project" ? (
                    <>
                      <Field>
                        <FieldLabel htmlFor={idPrefix + "name"}>Name</FieldLabel>
                        <Input id={idPrefix + "name"} type="text" required
                          value={sheet.values.name}
                          onChange={e => setSheet(
                            { ...sheet, values: { ...sheet.values, name: e.target.value } }
                          )}
                        />
                      </Field>
                      <div className="grid gap-4">
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "start"}>Start</FieldLabel>
                          <MonthPicker
                            value={sheet.values.start}
                            id={idPrefix + "start"}
                            onChange={start => setSheet({
                              ...sheet,
                              values: {
                                ...sheet.values,
                                start,
                                end: sheet.values.end.isBefore(start) ? start : sheet.values.end
                              }
                            })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "end"}>End</FieldLabel>
                          <MonthPicker
                            value={sheet.values.end}
                            id={idPrefix + "end"}
                            onChange={end => setSheet({
                              ...sheet,
                              values: {
                                ...sheet.values,
                                end: end.isBefore(sheet.values.start) ? sheet.values.start : end
                              }
                            })}
                          />
                        </Field>
                      </div>
                    </>
                  ) : (
                    <>
                      <Field>
                        <FieldLabel htmlFor={idPrefix + "description"}>Description</FieldLabel>
                        <Input id={idPrefix + "description"} type="text" required
                          value={sheet.values.description}
                          onChange={e => setSheet(
                            { ...sheet, values: { ...sheet.values, description: e.target.value } }
                          )}
                        />
                      </Field>
                      <div className="grid gap-4">
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "type"}>Type</FieldLabel>

                          <Input
                            id={idPrefix + "type"}
                            type="text"
                            required
                            list="position-type-list"
                            value={sheet.values.type}
                            onChange={e =>
                              setSheet({ ...sheet, values: { ...sheet.values, type: e.target.value } })
                            }
                          />
                          <datalist id="position-type-list">
                            {allTypes.map(type => <option key={type} value={type} />)}
                          </datalist>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "quantity"}>Quantity</FieldLabel>
                          <Input
                            id={idPrefix + "quantity"}
                            type="number"
                            min={0}
                            step={0.01}
                            required
                            value={sheet.values.quantity}
                            onChange={e => setSheet(
                              { ...sheet, values: { ...sheet.values, quantity: Number(e.target.value) || 0 } }
                            )}
                          />
                        </Field>
                      </div>
                      <div className="grid gap-4">
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "start"}>Start</FieldLabel>
                          <MonthPicker
                            value={sheet.values.start}
                            id={idPrefix + "start"}
                            onChange={start => setSheet({
                              ...sheet,
                              values: {
                                ...sheet.values,
                                start,
                                end: sheet.values.end.isBefore(start) ? start : sheet.values.end
                              }
                            })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "end"}>End</FieldLabel>
                          <MonthPicker
                            value={sheet.values.end}
                            id={idPrefix + "end"}
                            onChange={end => setSheet({
                              ...sheet,
                              values: {
                                ...sheet.values,
                                end: end.isBefore(sheet.values.start) ? sheet.values.start : end
                              }
                            })}
                          />
                        </Field>
                      </div>
                    </>
                  )}
                </FieldGroup>
              </FieldSet>
              <SheetFooter>
                <Button type="submit">Save changes</Button>
                <Button variant="destructive" type="button" onClick={onDelete}>
                  {sheet.type === "project" ? "Delete Project" : "Delete Position"}
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
        <TableCaption>Project positions by month, type and project.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Month</TableHead>
            {projects.map((project, pIdx) => (
              <TableHead key={pIdx}>
                <Item>
                  <ItemContent>
                    <ItemTitle>
                      <Button
                        variant={selectedProjectIdx === pIdx && selectedPositionIdx == null ? "outline" : "ghost"}
                        size="sm"
                        onClick={() => onProjectClick(pIdx)}
                        type="button"
                      >
                        {project.name}
                      </Button>
                    </ItemTitle>
                    <ItemDescription>
                      {project.start.toShortString()} - {project.end.toShortString()}
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
                      + Position
                    </Button>
                  </ItemActions>
                </Item>
              </TableHead>
            ))}
            <TableHead className="text-center min-w-[130px]">Sum per type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month, mIdx) => (
            <Tooltip key={month.toString()}>
              <TooltipTrigger asChild>
                <TableRow key={month.toString()}>
                  <TableCell className="text-center font-semibold">{month.toShortString()}</TableCell>
                  {projects.map((project, pIdx) => (
                    <TableCell key={pIdx} className="align-top">
                      <div className="flex flex-col gap-y-1">
                        {project.positions.map((pos, posIdx) =>
                          month.isWithin(pos.start, pos.end) && (
                            <Button
                              key={posIdx}
                              variant={selectedProjectIdx === pIdx && selectedPositionIdx === posIdx ? "outline" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={e => { e.stopPropagation(); onPositionClick(pIdx, posIdx); }}
                              type="button"
                            >
                              <span className="mr-2">{pos.type}</span>
                              <span className="text-xs text-muted-foreground">{pos.quantity}</span>
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="align-top">
                    {allTypes.map((type, tIdx) => {
                      const sum = sumPerTypePerMonth[`${tIdx}_${mIdx}`] || 0;
                      return (
                        <div key={type} className="flex justify-between">
                          <span className="text-muted-foreground text-xs">{type}</span>
                          <span className={sum ? "font-semibold" : "opacity-40"}>{sum}</span>
                        </div>
                      );
                    })}
                  </TableCell>
                </TableRow>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                {month.toDate().toLocaleString("default", { month: "long", year: "numeric" })}
              </TooltipContent>
            </Tooltip>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- MAIN COMPONENT ---

export const ProjectGantt: React.FC<{ initialProjects: Project[] }> = ({ initialProjects }) => {
  // Normalize initial projects to use MonthYear
  const fixDates = (proj: Project): Project => ({
    ...proj,
    start: proj.start instanceof MonthYear ? proj.start : MonthYear.fromString(String(proj.start)),
    end: proj.end instanceof MonthYear ? proj.end : MonthYear.fromString(String(proj.end)),
    positions: proj.positions.map(pos => ({
      ...pos,
      start: pos.start instanceof MonthYear ? pos.start : MonthYear.fromString(String(pos.start)),
      end: pos.end instanceof MonthYear ? pos.end : MonthYear.fromString(String(pos.end)),
    })),
  });

  const [projects, setProjects] = useState<Project[]>(initialProjects.map(fixDates));

  // Sheet state
  const [sheet, setSheet] = useState<EditSheetState>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Add dialog state
  const defaultMonth = MonthYear.today();
  const defaultEnd = defaultMonth.addMonths(5);
  const defaultNewProject: ProjectInput = {
    name: "",
    start: defaultMonth,
    end: defaultEnd,
  };
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState<ProjectInput>(defaultNewProject);

  const makeDefaultNewPosition = (start: MonthYear, end: MonthYear): Position => ({
    description: "",
    quantity: 1,
    type: "",
    start, end,
  });
  const [addPositionOpen, setAddPositionOpen] = useState(false);
  const [addPosProjectIdx, setAddPosProjectIdx] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState<Position>(makeDefaultNewPosition(defaultMonth, defaultEnd));
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
    for (let ym = minYM; !ym.isAfter(maxYM); ym = ym.addMonths(1)) arr.push(ym);
    return arr;
  }, [projects, onlyFuture, today]);

  const allTypes = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => p.positions.map((pos) => pos.type)))),
    [projects]
  );

  const typeIndex = useMemo(() => {
    return new Map<string, number>(
      allTypes.map((type, i) => [type, i])
    );
  }, [allTypes]);

  // Sum for each [type, month]
  const sumPerTypePerMonth = useMemo(() => {
    const result: Record<string, number> = {};
    months.forEach((month, mIdx) => {
      projects.forEach(project => {
        project.positions.forEach(pos => {
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

  // --- Sheet: Open, Save, Delete ---
  function openProjectSheet(projectIdx: number) {
    const p = projects[projectIdx];
    setSheet({
      type: "project",
      projectIdx,
      values: { name: p.name, start: p.start, end: p.end },
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
      setProjects(projs =>
        projs.map((p, idx) => idx === sheet.projectIdx
          ? {
            ...p,
            name: sheet.values.name,
            start: sheet.values.start,
            end: sheet.values.end,
          }
          : p));
    } else {
      setProjects(projs =>
        projs.map((p, idx) => idx === sheet.projectIdx
          ? {
            ...p,
            positions: p.positions.map((pos, posIdx) =>
              posIdx === sheet.positionIdx
                ? { ...sheet.values }
                : pos
            ),
          }
          : p));
    }
    closeEditSheet();
  }
  function deleteSheetEdit() {
    if (!sheet) return closeEditSheet();
    if (sheet.type === "project") {
      if (window.confirm("Delete project?")) {
        setProjects(projs => projs.filter((_, idx) => idx !== sheet.projectIdx));
        closeEditSheet();
      }
    } else {
      if (window.confirm("Delete position?")) {
        setProjects(projs =>
          projs.map((p, idx) => idx === sheet.projectIdx
            ? { ...p, positions: p.positions.filter((_, posIdx) => posIdx !== sheet.positionIdx) }
            : p));
        closeEditSheet();
      }
    }
  }

  // Add Project/Position
  function handleAddProject(ev: FormEvent) {
    ev.preventDefault();
    const { name, start, end } = newProject;
    if (!name.trim()) return;
    setProjects([
      ...projects,
      { name: name.trim(), start, end, positions: [] }
    ]);
    setAddProjectOpen(false);
    setNewProject(defaultNewProject);
  }
  function handleAddPositionSubmit(e: FormEvent) {
    e.preventDefault();
    if (addPosProjectIdx == null) return;
    const { description, type, quantity, start, end } = newPosition;
    if (!description.trim() || !type.trim() || quantity < 0) return;
    setProjects(projects.map((p, idx) =>
      idx === addPosProjectIdx
        ? {
          ...p,
          positions: [
            ...p.positions,
            { description, quantity, type, start, end }
          ]
        }
        : p
    ));
    setAddPositionOpen(false);
    setNewPosition(makeDefaultNewPosition(projects[addPosProjectIdx].start, projects[addPosProjectIdx].end));
  }
  function handleAddPositionClick(pidx: number) {
    setAddPosProjectIdx(pidx);
    setAddPositionOpen(true);
    setNewPosition(makeDefaultNewPosition(projects[pidx].start, projects[pidx].end));
  }

  // --- Table selection highlighting ---
  const selectedProjectIdx = sheet && (sheet.type === "project" || sheet.type === "position") ? sheet.projectIdx : null;
  const selectedPositionIdx = sheet && sheet.type === "position" ? sheet.positionIdx : null;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold">Projects Timeline</h2>
        <AddProjectDialog
          open={addProjectOpen}
          onOpenChange={setAddProjectOpen}
          newProject={newProject}
          setNewProject={setNewProject}
          onAdd={handleAddProject}
        />
        <div className="flex items-center gap-2 ml-4">
          <Switch checked={onlyFuture} onCheckedChange={setOnlyFuture} id="future-months-switch" />
          <label htmlFor="future-months-switch" className="ml-1">Show only current and future months</label>
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
        onOpenChange={open => { if (!open) closeEditSheet(); }}
        sheet={sheet}
        setSheet={setSheet}
        onSave={saveSheetEdit}
        onDelete={deleteSheetEdit}
        allTypes={allTypes}
      />
    </div>
  );
};