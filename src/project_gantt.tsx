import type { Project } from "./types";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- Utility Functions (unchanged) ---
function monthDiff(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
}
function minDate(...dates: Date[]) {
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}
function maxDate(...dates: Date[]) {
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}
function addMonths(dt: Date, n: number) {
  return new Date(dt.getFullYear(), dt.getMonth() + n, 1);
}
function formatMonth(dt: Date) {
  return dt.toLocaleString("default", { month: "short", year: "2-digit" });
}
function formatDateInput(dt: Date | string | undefined | null) {
  if (!dt) return "";
  if (typeof dt === "string") return dt;
  if (dt instanceof Date && !isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
  return "";
}

// --- Dialog Forms State ---
interface NewProjectFormState {
  name: string;
  start: string;
  end: string;
}
const defaultNewProject: NewProjectFormState = {
  name: "",
  start: formatDateInput(new Date()),
  end: formatDateInput(addMonths(new Date(), 5)),
};

interface NewPositionFormState {
  description: string;
  quantity: number;
  type: string;
  start: string;
  end: string;
}
const makeDefaultNewPosition = (start: Date, end: Date): NewPositionFormState => ({
  description: "",
  quantity: 1,
  type: "",
  start: formatDateInput(start),
  end: formatDateInput(end),
});

// Add Project Dialog (unchanged)
function AddProjectDialog({ newProject, setNewProject, show, setShow, addProject }: {
  newProject: NewProjectFormState,
  setNewProject: (np: NewProjectFormState) => void,
  show: boolean,
  setShow: (v: boolean) => void,
  addProject: (ev: React.FormEvent) => void
}) {
  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="ml-2">+ Add Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>Set project name and schedule.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={addProject} autoComplete="off">
          <Input
            autoFocus
            required
            placeholder="Project Name"
            value={newProject.name}
            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
          />
          <div className="flex gap-2">
            <label className="flex flex-col text-sm font-medium">
              Start
              <Input
                type="date"
                required
                value={newProject.start}
                onChange={e => setNewProject({ ...newProject, start: e.target.value })}
              />
            </label>
            <label className="flex flex-col text-sm font-medium">
              End
              <Input
                type="date"
                required
                value={newProject.end}
                min={newProject.start}
                onChange={e => setNewProject({ ...newProject, end: e.target.value })}
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="submit">Add</Button>
            <Button type="button" variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Position Dialog (unchanged)
function AddPositionDialog({ show, setShow, newPosition, setNewPosition, addPosition }: {
  show: boolean,
  setShow: (v: boolean) => void,
  newPosition: NewPositionFormState,
  setNewPosition: (np: NewPositionFormState) => void,
  addPosition: (e: React.FormEvent) => void,
}) {
  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogTrigger asChild>
        <div />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
          <DialogDescription>Enter details for the position.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" autoComplete="off" onSubmit={addPosition}>
          <Input
            autoFocus
            required
            placeholder="Description"
            value={newPosition.description}
            onChange={e => setNewPosition({ ...newPosition, description: e.target.value })}
          />
          <Input
            required
            placeholder="Type"
            value={newPosition.type}
            onChange={e => setNewPosition({ ...newPosition, type: e.target.value })}
          />
          <Input
            type="number"
            min={0}
            step={0.01}
            required
            placeholder="Quantity"
            value={newPosition.quantity}
            onChange={e => setNewPosition({ ...newPosition, quantity: Number(e.target.value) })}
          />
          <div className="flex gap-2">
            <label className="flex flex-col text-xs font-medium">
              From
              <Input
                type="date"
                required
                value={newPosition.start}
                onChange={e => setNewPosition({ ...newPosition, start: e.target.value })}
              />
            </label>
            <label className="flex flex-col text-xs font-medium">
              To
              <Input
                type="date"
                required
                min={newPosition.start}
                value={newPosition.end}
                onChange={e => setNewPosition({ ...newPosition, end: e.target.value })}
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="submit">Add</Button>
            <Button type="button" variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Shared Sheet for Editing Project or Position ---
function EditSheet({
  open, onOpenChange,
  isProjectEdit,
  editableItem,
  setEditableItem,
  onSave,
  onDelete,
}: {
  open: boolean,
  onOpenChange: (v: boolean) => void,
  isProjectEdit: boolean,
  editableItem: any,
  setEditableItem: (item: any) => void,
  onSave: () => void,
  onDelete: () => void,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isProjectEdit ? "Edit Project" : "Edit Position"}
          </SheetTitle>
          <SheetDescription>
            {isProjectEdit
              ? "Edit the project details below."
              : "Edit the position details below."}
          </SheetDescription>
        </SheetHeader>
        <form
          className="grid gap-4 mt-2"
          onSubmit={e => { e.preventDefault(); onSave(); }}
        >
          {isProjectEdit ? (
            <>
              <div>
                <label className="font-medium text-sm">Name:</label>
                <Input
                  type="text"
                  className="w-48"
                  value={editableItem?.name || ""}
                  onChange={e => setEditableItem({ ...editableItem, name: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <label className="font-medium text-sm">Start:</label>
                <Input
                  type="date"
                  className="w-32"
                  value={formatDateInput(editableItem?.start)}
                  onChange={e => setEditableItem({ ...editableItem, start: new Date(e.target.value) })}
                />
                <label className="font-medium text-sm">End:</label>
                <Input
                  type="date"
                  className="w-32"
                  value={formatDateInput(editableItem?.end)}
                  min={formatDateInput(editableItem?.start)}
                  onChange={e => setEditableItem({ ...editableItem, end: new Date(e.target.value) })}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="font-medium text-sm">Description:</label>
                <Input
                  type="text"
                  className="w-48"
                  value={editableItem?.description || ""}
                  onChange={e => setEditableItem({ ...editableItem, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <label className="font-medium text-sm">Type:</label>
                <Input
                  type="text"
                  className="w-20"
                  value={editableItem?.type || ""}
                  onChange={e => setEditableItem({ ...editableItem, type: e.target.value })}
                />
                <label className="font-medium text-sm">Quantity:</label>
                <Input
                  type="number"
                  className="w-20"
                  min={0}
                  step={0.01}
                  value={editableItem?.quantity ?? 1}
                  onChange={e => setEditableItem({ ...editableItem, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="flex gap-2">
                <label className="font-medium text-sm">Start:</label>
                <Input
                  type="date"
                  className="w-32"
                  value={formatDateInput(editableItem?.start)}
                  onChange={e => setEditableItem({ ...editableItem, start: new Date(e.target.value) })}
                />
                <label className="font-medium text-sm">End:</label>
                <Input
                  type="date"
                  className="w-32"
                  min={formatDateInput(editableItem?.start)}
                  value={formatDateInput(editableItem?.end)}
                  onChange={e => setEditableItem({ ...editableItem, end: new Date(e.target.value) })}
                />
              </div>
            </>
          )}

          <SheetFooter>
            <Button type="submit">Save changes</Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </SheetClose>
            <Button type="button" variant="destructive" onClick={onDelete}>
              {isProjectEdit ? "Delete Project" : "Delete Position"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// --- Table ---
function ProjectTable({
  projects, months, allTypes, sumPerTypePerMonth,
  onProjectClick, onPositionClick,
  onAddPositionClick,
  selectedProjectIdx, selectedPositionIdx,
}: {
  projects: Project[],
  months: Date[],
  allTypes: string[],
  sumPerTypePerMonth: Record<string, number>,
  onProjectClick: (pidx: number) => void,
  onPositionClick: (pidx: number, posIdx: number) => void,
  onAddPositionClick: (pidx: number) => void,
  selectedProjectIdx: number | null,
  selectedPositionIdx: number | null,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th className="text-center font-semibold py-2 min-w-[92px]">Month</th>
            {projects.map((project, pIdx) => (
              <th key={pIdx} className="text-center font-semibold px-3 min-w-[200px]">
                <button
                  type="button"
                  className={
                    "font-semibold px-2 underline-offset-2" +
                    (selectedProjectIdx === pIdx && selectedPositionIdx == null
                      ? " underline text-primary"
                      : " hover:underline")
                  }
                  title="Select project"
                  onClick={() => onProjectClick(pIdx)}
                >
                  {project.name}
                </button>
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
              </th>
            ))}
            <th className="text-center font-semibold py-2 min-w-[130px]">Sum per type</th>
          </tr>
        </thead>
        <tbody>
          {months.map((month, mIdx) => (
            <tr key={mIdx} className={mIdx % 2 === 1 ? "bg-muted" : undefined}>
              <td className="text-center font-semibold">{formatMonth(month)}</td>
              {projects.map((project, pIdx) => {
                const isActive = project.end >= month && project.start < addMonths(month, 1);
                const monthPositions = project.positions.map((pos, posIdx) =>
                  (pos.end >= month && pos.start < addMonths(month, 1)) && (
                    <button
                      type="button"
                      key={posIdx}
                      className={
                        "block text-left w-full rounded-sm border px-2 py-0.5 mb-1 cursor-pointer transition " +
                        (selectedProjectIdx === pIdx && selectedPositionIdx === posIdx
                          ? "bg-primary/10 border-primary font-medium"
                          : "hover:bg-accent")
                      }
                      title={pos.description}
                      onClick={e => { e.stopPropagation(); onPositionClick(pIdx, posIdx); }}
                    >
                      <span className="text-sm mr-2">{pos.type}</span>
                      <span className="text-xs text-muted-foreground">{pos.quantity}</span>
                    </button>
                  )
                );
                return (
                  <td
                    key={pIdx}
                    className={"align-top" + (!isActive ? " opacity-60 bg-muted-foreground/10" : "")}
                  >
                    {monthPositions}
                  </td>
                );
              })}
              <td className="align-top p-1">
                {allTypes.map((type, tIdx) => {
                  const sum = sumPerTypePerMonth[`${tIdx}_${mIdx}`] || 0;
                  return (
                    <div key={type} className="flex justify-between">
                      <span className="text-muted-foreground text-xs">{type}</span>
                      <span className={sum ? "font-semibold" : "opacity-40"}>{sum}</span>
                    </div>
                  );
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Main Component
export const ProjectGantt: React.FC<{ initialProjects: Project[] }> = ({
  initialProjects,
}) => {
  const fixDates = (proj: Project): Project => ({
    ...proj,
    start: new Date(proj.start),
    end: new Date(proj.end),
    positions: proj.positions.map((pos) => ({
      ...pos,
      start: new Date(pos.start),
      end: new Date(pos.end),
    })),
  });
  const [projects, setProjects] = useState<Project[]>(initialProjects.map(fixDates));

  // Sheet & selection states:
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [sheetProjectIdx, setSheetProjectIdx] = useState<number | null>(null);
  const [sheetPositionIdx, setSheetPositionIdx] = useState<number | null>(null);
  const [editableItem, setEditableItem] = useState<any>(null);

  // Add Project/Position dialog states:
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState<NewProjectFormState>(defaultNewProject);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [addPosProjectIdx, setAddPosProjectIdx] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState<NewPositionFormState>(
    makeDefaultNewPosition(new Date(), new Date())
  );

  // Months/types calculations (unchanged)
  const months = useMemo(() => {
    if (projects.length === 0) return [];
    const starts = projects.map((p) => p.start);
    const ends = projects.map((p) => p.end);
    const minD = minDate(...starts);
    const maxD = maxDate(...ends);
    const monthCount = monthDiff(minD, maxD) + 1;
    return Array.from({ length: monthCount }, (_, i) => addMonths(minD, i));
  }, [projects]);
  const allTypes = useMemo(
    () =>
      Array.from(
        new Set(projects.flatMap((p) => p.positions.map((pos) => pos.type)))
      ),
    [projects]
  );
  const sumPerTypePerMonth = useMemo(() => {
    const result: Record<string, number> = {};
    for (let mIdx = 0; mIdx < months.length; ++mIdx) {
      const month = months[mIdx];
      const monthStart = month;
      const monthEnd = addMonths(monthStart, 1);
      for (const project of projects) {
        for (const pos of project.positions) {
          if (pos.end >= monthStart && pos.start < monthEnd) {
            const key = `${allTypes.indexOf(pos.type)}_${mIdx}`;
            result[key] = (result[key] || 0) + pos.quantity;
          }
        }
      }
    }
    return result;
  }, [projects, months, allTypes]);

  // --- Handlers for opening the edit Sheet ---
  function openProjectSheet(pidx: number) {
    setEditableItem({ ...projects[pidx] });
    setSheetProjectIdx(pidx);
    setSheetPositionIdx(null);
    setEditSheetOpen(true);
  }
  function openPositionSheet(pidx: number, posIdx: number) {
    setEditableItem({ ...projects[pidx].positions[posIdx] });
    setSheetProjectIdx(pidx);
    setSheetPositionIdx(posIdx);
    setEditSheetOpen(true);
  }
  function closeEditSheet() {
    setEditSheetOpen(false);
    setSheetProjectIdx(null);
    setSheetPositionIdx(null);
    setEditableItem(null);
  }

  // --- Save/Remove from sheet ---
  function saveSheetEdit() {
    if (sheetProjectIdx == null) return closeEditSheet();
    if (sheetPositionIdx == null) {
      // Project editing
      setProjects(projs => projs.map((p, idx) => idx === sheetProjectIdx ? {
        ...p,
        name: editableItem.name,
        start: new Date(editableItem.start),
        end: new Date(editableItem.end),
      } : p));
    } else {
      // Position editing
      setProjects(projs => projs.map((p, idx) => idx === sheetProjectIdx ? {
        ...p,
        positions: p.positions.map((pos, k) => k === sheetPositionIdx
          ? {
              ...pos,
              description: editableItem.description,
              quantity: +editableItem.quantity,
              type: editableItem.type,
              start: new Date(editableItem.start),
              end: new Date(editableItem.end),
            }
          : pos
        )
      } : p));
    }
    closeEditSheet();
  }
  function deleteSheetEdit() {
    if (sheetProjectIdx == null) return closeEditSheet();
    if (sheetPositionIdx == null) {
      if (window.confirm("Delete project?")) {
        setProjects(projs => projs.filter((_, idx) => idx !== sheetProjectIdx));
        closeEditSheet();
      }
    } else {
      if (window.confirm("Delete position?")) {
        setProjects(projs => projs.map((p, idx) => idx === sheetProjectIdx
          ? { ...p, positions: p.positions.filter((_, k) => k !== sheetPositionIdx) }
          : p
        ));
        closeEditSheet();
      }
    }
  }

  // --- Add Project ---
  function handleAddProject(ev: React.FormEvent) {
    ev.preventDefault();
    const { name, start, end } = newProject;
    if (!name.trim()) return;
    setProjects([
      ...projects,
      {
        name: name.trim(),
        start: new Date(start),
        end: new Date(end),
        positions: [],
      },
    ]);
    setShowAddProject(false);
    setNewProject(defaultNewProject);
  }

  // --- Add Position ---
  function handleAddPositionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (addPosProjectIdx == null) return;
    const np = newPosition;
    if (!np.description.trim() || !np.type.trim() || np.quantity < 0) return;
    setProjects(projects.map((p, idx) =>
      idx === addPosProjectIdx
        ? {
            ...p,
            positions: [
              ...p.positions,
              {
                description: np.description,
                quantity: Number(np.quantity),
                type: np.type,
                start: new Date(np.start),
                end: new Date(np.end),
              }
            ]
          }
        : p
    ));
    setShowAddPosition(false);
    setNewPosition(makeDefaultNewPosition(projects[addPosProjectIdx].start, projects[addPosProjectIdx].end));
  }
  function handleAddPositionClick(pidx: number) {
    setAddPosProjectIdx(pidx);
    setShowAddPosition(true);
    setNewPosition(makeDefaultNewPosition(projects[pidx].start, projects[pidx].end));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold">Projects Timeline</h2>
        <AddProjectDialog
          newProject={newProject}
          setNewProject={setNewProject}
          show={showAddProject}
          setShow={setShowAddProject}
          addProject={handleAddProject}
        />
      </div>
      <ProjectTable
        projects={projects} months={months} allTypes={allTypes} sumPerTypePerMonth={sumPerTypePerMonth}
        onProjectClick={openProjectSheet}
        onPositionClick={openPositionSheet}
        onAddPositionClick={handleAddPositionClick}
        selectedProjectIdx={sheetProjectIdx}
        selectedPositionIdx={sheetPositionIdx}
      />
      <AddPositionDialog
        show={showAddPosition}
        setShow={setShowAddPosition}
        newPosition={newPosition}
        setNewPosition={setNewPosition}
        addPosition={handleAddPositionSubmit}
      />
      <EditSheet
        open={editSheetOpen}
        onOpenChange={open => !open && closeEditSheet()}
        isProjectEdit={sheetPositionIdx == null}
        editableItem={editableItem}
        setEditableItem={setEditableItem}
        onSave={saveSheetEdit}
        onDelete={deleteSheetEdit}
      />
    </div>
  );
};