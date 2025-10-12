import React, { useMemo, useState, type FormEvent } from "react";
import type { Project } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Utility Types & Functions ---

export interface PositionInput {
  description: string;
  quantity: number;
  type: string;
  start: string; // date string ("YYYY-MM-DD")
  end: string;
}
export interface ProjectInput {
  name: string;
  start: string;
  end: string;
}

function monthDiff(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
}
function minDate(...dates: Date[]): Date { return new Date(Math.min(...dates.map(d => d.getTime()))); }
function maxDate(...dates: Date[]): Date { return new Date(Math.max(...dates.map(d => d.getTime()))); }
function addMonths(dt: Date, n: number) { return new Date(dt.getFullYear(), dt.getMonth() + n, 1); }
function formatMonth(dt: Date) {
  return dt.toLocaleString("default", { month: "short", year: "2-digit" });
}
function formatDateInput(dt?: Date | string | null) {
  if (!dt) return "";
  if (typeof dt === "string") return dt;
  if (dt instanceof Date && !isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
  return "";
}

// --- Editable (Sheet) State ---
type EditSheetState =
  | { type: "project", projectIdx: number, values: ProjectInput }
  | { type: "position", projectIdx: number, positionIdx: number, values: PositionInput }
  | null;

// --- Add Dialogs ---
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
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>Set project name and schedule.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onAdd} autoComplete="off">
          <Input autoFocus required placeholder="Project Name"
            value={newProject.name}
            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
          />
          <div className="flex gap-2">
            <label className="flex flex-col text-sm font-medium">
              Start
              <Input type="date" required
                value={newProject.start}
                onChange={e => setNewProject({ ...newProject, start: e.target.value })}
              />
            </label>
            <label className="flex flex-col text-sm font-medium">
              End
              <Input type="date" required
                min={newProject.start}
                value={newProject.end}
                onChange={e => setNewProject({ ...newProject, end: e.target.value })}
              />
            </label>
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
  newPosition: PositionInput;
  setNewPosition: (v: PositionInput) => void;
  onAdd: (e: FormEvent) => void;
}) {
  const { open, onOpenChange, newPosition, setNewPosition, onAdd } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
          <DialogDescription>Enter details for the position.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" autoComplete="off" onSubmit={onAdd}>
          <Input autoFocus required placeholder="Description"
            value={newPosition.description}
            onChange={e => setNewPosition({ ...newPosition, description: e.target.value })}
          />
          <Input required placeholder="Type"
            value={newPosition.type}
            onChange={e => setNewPosition({ ...newPosition, type: e.target.value })}
          />
          <Input type="number" min={0} step={0.01} required placeholder="Quantity"
            value={newPosition.quantity}
            onChange={e => setNewPosition({ ...newPosition, quantity: Number(e.target.value) })}
          />
          <div className="flex gap-2">
            <label className="flex flex-col text-xs font-medium">
              From
              <Input type="date" required
                value={newPosition.start}
                onChange={e => setNewPosition({ ...newPosition, start: e.target.value })}
              />
            </label>
            <label className="flex flex-col text-xs font-medium">
              To
              <Input type="date" required min={newPosition.start}
                value={newPosition.end}
                onChange={e => setNewPosition({ ...newPosition, end: e.target.value })}
              />
            </label>
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

// --- Edit Sheet ---
function EditSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheet: EditSheetState;
  setSheet: (sheet: EditSheetState) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { open, onOpenChange, sheet, setSheet, onSave, onDelete } = props;

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
                          <Input id={idPrefix + "start"} type="date" required
                            value={sheet.values.start}
                            onChange={e => setSheet(
                              { ...sheet, values: { ...sheet.values, start: e.target.value } }
                            )}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "end"}>End</FieldLabel>
                          <Input id={idPrefix + "end"} type="date" required min={sheet.values.start}
                            value={sheet.values.end}
                            onChange={e => setSheet(
                              { ...sheet, values: { ...sheet.values, end: e.target.value } }
                            )}
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
                          <Input id={idPrefix + "type"} type="text" required
                            value={sheet.values.type}
                            onChange={e => setSheet(
                              { ...sheet, values: { ...sheet.values, type: e.target.value } }
                            )}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "quantity"}>Quantity</FieldLabel>
                          <Input id={idPrefix + "quantity"} type="number" min={0} step={0.01} required
                            value={sheet.values.quantity}
                            onChange={e => setSheet(
                              { ...sheet, values: { ...sheet.values, quantity: Number(e.target.value) } }
                            )}
                          />
                        </Field>
                      </div>
                      <div className="grid gap-4">
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "start"}>Start</FieldLabel>
                          <Input id={idPrefix + "start"} type="date" required
                            value={sheet.values.start}
                            onChange={e => setSheet(
                              { ...sheet, values: { ...sheet.values, start: e.target.value } }
                            )}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={idPrefix + "end"}>End</FieldLabel>
                          <Input id={idPrefix + "end"} type="date" required min={sheet.values.start}
                            value={sheet.values.end}
                            onChange={e => setSheet(
                              { ...sheet, values: { ...sheet.values, end: e.target.value } }
                            )}
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

interface ProjectTableProps {
  projects: Project[];
  months: Date[];
  allTypes: string[];
  sumPerTypePerMonth: Record<string, number>;
  onProjectClick: (pidx: number) => void;
  onPositionClick: (pidx: number, posIdx: number) => void;
  onAddPositionClick: (pidx: number) => void;
  selectedProjectIdx: number | null;
  selectedPositionIdx: number | null;
}

export function ProjectTable({
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
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>Project positions by month, type and project.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Month</TableHead>
            {projects.map((project, pIdx) => (
              <TableHead key={pIdx} className="text-center min-w-[200px]">
                <Button
                  variant={selectedProjectIdx === pIdx && selectedPositionIdx == null ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => onProjectClick(pIdx)}
                >
                  {project.name}
                </Button>
                <div className="flex gap-1 justify-center text-xs text-muted-foreground">
                  {formatDateInput(project.start)}-{formatDateInput(project.end)}
                </div>
                <Button
                  onClick={() => onAddPositionClick(pIdx)}
                  className="mt-2"
                  size="sm"
                  variant="secondary"
                  type="button"
                >
                  + Position
                </Button>
              </TableHead>
            ))}
            <TableHead className="text-center min-w-[130px]">Sum per type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month, mIdx) => (
            <TableRow key={mIdx}>
              <TableCell className="text-center font-semibold">{formatMonth(month)}</TableCell>
              {projects.map((project, pIdx) => (
                <TableCell key={pIdx} className="align-top">
                  <div className="flex flex-col gap-y-1">
                    {project.positions.map((pos, posIdx) =>
                      pos.end >= month && pos.start < addMonths(month, 1) && (
                        <Button
                          key={posIdx}
                          variant={selectedProjectIdx === pIdx && selectedPositionIdx === posIdx ? "outline" : "ghost"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={e => { e.stopPropagation(); onPositionClick(pIdx, posIdx); }}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- Main Component ---
export const ProjectGantt: React.FC<{ initialProjects: Project[] }> = ({ initialProjects }) => {
  // Utility to fix date fields on load
  function fixDates(proj: Project): Project {
    return {
      ...proj,
      start: new Date(proj.start),
      end: new Date(proj.end),
      positions: proj.positions.map((pos) => ({
        ...pos,
        start: new Date(pos.start),
        end: new Date(pos.end),
      })),
    };
  }
  const [projects, setProjects] = useState<Project[]>(initialProjects.map(fixDates));
  // Sheet state
  const [sheet, setSheet] = useState<EditSheetState>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Add dialog state
  const defaultNewProject: ProjectInput = {
    name: "",
    start: formatDateInput(new Date()),
    end: formatDateInput(addMonths(new Date(), 5)),
  };
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState<ProjectInput>(defaultNewProject);

  const makeDefaultNewPosition = (start: Date, end: Date): PositionInput => ({
    description: "",
    quantity: 1,
    type: "",
    start: formatDateInput(start),
    end: formatDateInput(end),
  });
  const [addPositionOpen, setAddPositionOpen] = useState(false);
  const [addPosProjectIdx, setAddPosProjectIdx] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState<PositionInput>(makeDefaultNewPosition(new Date(), new Date()));

  // Derived
  const months = useMemo(() => {
    if (projects.length === 0) return [];
    const starts = projects.map((p) => p.start);
    const ends = projects.map((p) => p.end);
    const minD = minDate(...starts);
    const maxD = maxDate(...ends);
    const monthCount = monthDiff(minD, maxD) + 1;
    return Array.from({ length: monthCount }, (_, i) => addMonths(minD, i));
  }, [projects]);
  const allTypes = useMemo(() =>
    Array.from(new Set(projects.flatMap((p) => p.positions.map((pos) => pos.type)))), [projects]);
  const sumPerTypePerMonth = useMemo(() => {
    const result: Record<string, number> = {};
    months.forEach((month, mIdx) => {
      const monthStart = month;
      const monthEnd = addMonths(monthStart, 1);
      projects.forEach(project => {
        project.positions.forEach(pos => {
          if (pos.end >= monthStart && pos.start < monthEnd) {
            const key = `${allTypes.indexOf(pos.type)}_${mIdx}`;
            result[key] = (result[key] || 0) + pos.quantity;
          }
        });
      });
    });
    return result;
  }, [projects, months, allTypes]);

  // --- Sheet: Open, Save, Delete ---
  function openProjectSheet(projectIdx: number) {
    const p = projects[projectIdx];
    setSheet({
      type: "project",
      projectIdx,
      values: {
        name: p.name,
        start: formatDateInput(p.start),
        end: formatDateInput(p.end),
      }
    });
    setEditSheetOpen(true);
  }
  function openPositionSheet(projectIdx: number, positionIdx: number) {
    const pos = projects[projectIdx].positions[positionIdx];
    setSheet({
      type: "position",
      projectIdx,
      positionIdx,
      values: {
        description: pos.description,
        quantity: pos.quantity,
        type: pos.type,
        start: formatDateInput(pos.start),
        end: formatDateInput(pos.end),
      },
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
            start: new Date(sheet.values.start),
            end: new Date(sheet.values.end),
          }
          : p));
    } else {
      setProjects(projs =>
        projs.map((p, idx) => idx === sheet.projectIdx
          ? {
            ...p,
            positions: p.positions.map((pos, posIdx) =>
              posIdx === sheet.positionIdx
                ? {
                  ...pos,
                  description: sheet.values.description,
                  type: sheet.values.type,
                  quantity: sheet.values.quantity,
                  start: new Date(sheet.values.start),
                  end: new Date(sheet.values.end),
                }
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
      { name: name.trim(), start: new Date(start), end: new Date(end), positions: [] }
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
            {
              description,
              quantity,
              type,
              start: new Date(start),
              end: new Date(end),
            }
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

  // --- Selection for highlighting table ---
  const selectedProjectIdx = sheet && (sheet.type === "project" || sheet.type === "position") ? sheet.projectIdx : null;
  const selectedPositionIdx = sheet && sheet.type === "position" ? sheet.positionIdx : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold">Projects Timeline</h2>
        <AddProjectDialog
          open={addProjectOpen}
          onOpenChange={setAddProjectOpen}
          newProject={newProject}
          setNewProject={setNewProject}
          onAdd={handleAddProject}
        />
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
      />
      <EditSheet
        open={editSheetOpen}
        onOpenChange={open => !open && closeEditSheet()}
        sheet={sheet}
        setSheet={setSheet}
        onSave={saveSheetEdit}
        onDelete={deleteSheetEdit}
      />
    </div>
  );
};