import type { Project, Position } from "./types";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- util functions ---
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
function formatDateInput(dt: Date) {
  return dt.toISOString().split("T")[0];
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

// ------------------------------ COMPONENTS -----------------------------

// Add Project Dialog
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
          <DialogDescription>
            Set project name and schedule.
          </DialogDescription>
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

// Add Position Dialog
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
        <Button size="sm" variant="secondary">+ Position</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
          <DialogDescription>
            Enter details for the position.
          </DialogDescription>
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

// Single Panel to edit selected project or position
function EditPanel({
  selectedProjectIdx,
  selectedPositionIdx,
  projects,
  updateProject,
  removeProject,
  updatePosition,
  removePosition,
  clearSelection,
}: {
  selectedProjectIdx: number | null,
  selectedPositionIdx: number | null,
  projects: Project[],
  updateProject: (idx: number, proj: Partial<Project>) => void,
  removeProject: (idx: number) => void,
  updatePosition: (pidx: number, posIdx: number, pos: Partial<Position>) => void,
  removePosition: (pidx: number, posIdx: number) => void,
  clearSelection: () => void,
}) {
  if (selectedProjectIdx == null) return null;
  const project = projects[selectedProjectIdx];
  if (!project) return null;
  if (selectedPositionIdx == null) {
    // --- PROJECT editing
    return (
      <div className="p-4 border rounded mt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Edit Project</h4>
          <Button size="sm" variant="outline" onClick={clearSelection}>Close</Button>
        </div>
        <div className="mb-2">
          <label className="font-medium text-sm">Name:</label>
          <Input
            type="text"
            className="w-40"
            value={project.name}
            onChange={e => updateProject(selectedProjectIdx, { name: e.target.value })}
          />
        </div>
        <div className="mb-2 flex gap-2">
          <label className="font-medium text-sm">Start:</label>
          <Input
            type="date"
            className="w-32"
            value={formatDateInput(project.start)}
            onChange={e => updateProject(selectedProjectIdx, { start: new Date(e.target.value) })}
          />
          <label className="font-medium text-sm">End:</label>
          <Input
            type="date"
            className="w-32"
            min={formatDateInput(project.start)}
            value={formatDateInput(project.end)}
            onChange={e => updateProject(selectedProjectIdx, { end: new Date(e.target.value) })}
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            if (window.confirm("Delete project?")) {
              removeProject(selectedProjectIdx);
              clearSelection();
            }
          }}
        >
          Delete Project
        </Button>
      </div>
    );
  } else {
    // --- POSITION editing
    const pos = project.positions[selectedPositionIdx];
    if (!pos) return null;
    return (
      <div className="p-4 border rounded mt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Edit Position</h4>
          <Button size="sm" variant="outline" onClick={clearSelection}>Close</Button>
        </div>
        <div className="mb-2">
          <label className="font-medium text-sm">Description:</label>
          <Input
            type="text"
            className="w-48"
            value={pos.description}
            onChange={e => updatePosition(selectedProjectIdx, selectedPositionIdx, { description: e.target.value })}
          />
        </div>
        <div className="mb-2 flex gap-2">
          <label className="font-medium text-sm">Type:</label>
          <Input
            type="text"
            className="w-20"
            value={pos.type}
            onChange={e => updatePosition(selectedProjectIdx, selectedPositionIdx, { type: e.target.value })}
          />
          <label className="font-medium text-sm">Quantity:</label>
          <Input
            type="number"
            min={0}
            step={0.01}
            className="w-20"
            value={pos.quantity}
            onChange={e => updatePosition(selectedProjectIdx, selectedPositionIdx, { quantity: Number(e.target.value) })}
          />
        </div>
        <div className="mb-2 flex gap-2">
          <label className="font-medium text-sm">Start:</label>
          <Input
            type="date"
            className="w-32"
            value={formatDateInput(pos.start)}
            onChange={e => updatePosition(selectedProjectIdx, selectedPositionIdx, { start: new Date(e.target.value) })}
          />
          <label className="font-medium text-sm">End:</label>
          <Input
            type="date"
            className="w-32"
            min={formatDateInput(pos.start)}
            value={formatDateInput(pos.end)}
            onChange={e => updatePosition(selectedProjectIdx, selectedPositionIdx, { end: new Date(e.target.value) })}
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            if (window.confirm("Delete position?")) {
              removePosition(selectedProjectIdx, selectedPositionIdx);
              clearSelection();
            }
          }}
        >
          Delete Position
        </Button>
      </div>
    );
  }
}

// The table -- clickable for selection, NO editing inline, no buttons per project/position
function ProjectTable({
  projects,
  months,
  allTypes,
  sumPerTypePerMonth,
  selectedProjectIdx,
  selectedPositionIdx,
  setSelectedProjectIdx,
  setSelectedPositionIdx,
  onAddPositionClick,
}: {
  projects: Project[],
  months: Date[],
  allTypes: string[],
  sumPerTypePerMonth: Record<string, number>,
  selectedProjectIdx: number | null,
  selectedPositionIdx: number | null,
  setSelectedProjectIdx: (idx: number | null) => void,
  setSelectedPositionIdx: (idx: number | null) => void,
  onAddPositionClick: (pidx: number) => void,
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
                    (selectedProjectIdx === pIdx && selectedPositionIdx === null
                      ? " underline text-primary"
                      : " hover:underline")
                  }
                  title="Select project"
                  onClick={() => {
                    setSelectedProjectIdx(pIdx);
                    setSelectedPositionIdx(null);
                  }}
                >
                  {project.name}
                </button>
                <div className="flex gap-1 justify-center text-xs text-muted-foreground">
                  {formatDateInput(project.start)} - {formatDateInput(project.end)}
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
            <th className="text-center font-semibold py-2 min-w-[130px]">
              Sum per type
            </th>
          </tr>
        </thead>
        <tbody>
          {months.map((month, mIdx) => (
            <tr key={mIdx} className={mIdx % 2 === 1 ? "bg-muted" : undefined}>
              {/* Month label */}
              <td className="text-center font-semibold">{formatMonth(month)}</td>
              {projects.map((project, pIdx) => {
                const isActive = project.end >= month && project.start < addMonths(month, 1);
                const monthPositions = project.positions.map((pos, posIdx) => {
                  if (pos.end >= month && pos.start < addMonths(month, 1)) {
                    return (
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
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedProjectIdx(pIdx);
                          setSelectedPositionIdx(posIdx);
                        }}
                      >
                        <span className="text-sm mr-2">{pos.type}</span>
                        <span className="text-xs text-muted-foreground">{pos.quantity}</span>
                      </button>
                    );
                  }
                  return null;
                }).filter(Boolean);
                return (
                  <td
                    key={pIdx}
                    className={
                      "align-top" +
                      (!isActive ? " opacity-60 bg-muted-foreground/10" : "")
                    }
                  >
                    {monthPositions}
                  </td>
                );
              })}
              {/* Per-type sum */}
              <td className="align-top p-1">
                {allTypes.map((type, tIdx) => {
                  const sum = sumPerTypePerMonth[`${tIdx}_${mIdx}`] || 0;
                  return (
                    <div key={type} className="flex justify-between">
                      <span className="text-muted-foreground text-xs">{type}</span>
                      <span className={sum ? "font-semibold" : "opacity-40"}>
                        {sum}
                      </span>
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
  // --- Date/Fix up state ---
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
  const [selectedProjectIdx, setSelectedProjectIdx] = useState<number | null>(null);
  const [selectedPositionIdx, setSelectedPositionIdx] = useState<number | null>(null);

  // --- State for Add Project/Position dialogs ---
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState<NewProjectFormState>(defaultNewProject);

  const [showAddPosition, setShowAddPosition] = useState(false);
  const [addPosProjectIdx, setAddPosProjectIdx] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState<NewPositionFormState>(
    makeDefaultNewPosition(new Date(), new Date())
  );

  // -- months/types calculations
  const months = useMemo(() => {
    if (projects.length === 0) return [];
    const starts = projects.map((p) => p.start);
    const ends = projects.map((p) => p.end);
    const minD = minDate(...starts);
    const maxD = maxDate(...ends);
    const monthCount = monthDiff(minD, maxD) + 1;
    return Array.from({ length: monthCount }, (_, i) =>
      addMonths(minD, i)
    );
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

  // -- Edit handlers (project/position)
  function updateProject(idx: number, change: Partial<Project>) {
    setProjects(projs => projs.map((p, i) => i === idx ? { ...p, ...change } : p));
  }
  function removeProject(idx: number) {
    setProjects(projs => projs.filter((_, i) => i !== idx));
    if (selectedProjectIdx === idx) {
      setSelectedProjectIdx(null);
      setSelectedPositionIdx(null);
    }
  }
  function updatePosition(pidx: number, posIdx: number, change: Partial<Position>) {
    setProjects(projs =>
      projs.map((p, i) =>
        i === pidx
          ? {
              ...p,
              positions: p.positions.map((pos, k) => k === posIdx ? { ...pos, ...change } : pos),
            }
          : p
      )
    );
  }
  function removePosition(pidx: number, posIdx: number) {
    setProjects(projs =>
      projs.map((p, i) =>
        i === pidx
          ? { ...p, positions: p.positions.filter((_, k) => k !== posIdx) }
          : p
      )
    );
    if (selectedProjectIdx === pidx && selectedPositionIdx === posIdx) {
      setSelectedPositionIdx(null);
    }
  }
  function clearSelection() {
    setSelectedProjectIdx(null);
    setSelectedPositionIdx(null);
  }

  // --- Add Project
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

  // --- Add Position
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
        projects={projects}
        months={months}
        allTypes={allTypes}
        sumPerTypePerMonth={sumPerTypePerMonth}
        selectedProjectIdx={selectedProjectIdx}
        selectedPositionIdx={selectedPositionIdx}
        setSelectedProjectIdx={setSelectedProjectIdx}
        setSelectedPositionIdx={setSelectedPositionIdx}
        onAddPositionClick={handleAddPositionClick}
      />
      <AddPositionDialog
        show={showAddPosition}
        setShow={setShowAddPosition}
        newPosition={newPosition}
        setNewPosition={setNewPosition}
        addPosition={handleAddPositionSubmit}
      />
      <EditPanel
        selectedProjectIdx={selectedProjectIdx}
        selectedPositionIdx={selectedPositionIdx}
        projects={projects}
        updateProject={updateProject}
        removeProject={removeProject}
        updatePosition={updatePosition}
        removePosition={removePosition}
        clearSelection={clearSelection}
      />
    </div>
  );
};