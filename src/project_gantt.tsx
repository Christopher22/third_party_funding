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
const makeDefaultNewPosition = (
  start: Date,
  end: Date
): NewPositionFormState => ({
  description: "",
  quantity: 1,
  type: "",
  start: formatDateInput(start),
  end: formatDateInput(end),
});

interface ProjectGanttProps {
  initialProjects: Project[];
}
export const ProjectGantt: React.FC<ProjectGanttProps> = ({
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

  const [projects, setProjects] = useState<Project[]>(
    initialProjects.map(fixDates)
  );

  // --- State for ADD PROJECT dialog ---
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState<NewProjectFormState>(
    defaultNewProject
  );
  // --- State for ADD POSITION dialog per project ---
  const [showAddPosition, setShowAddPosition] = useState<{ [pidx: number]: boolean }>({});
  const [newPosition, setNewPosition] = useState<{ [pidx: number]: NewPositionFormState }>({});

  // --- Calculations (months, types, sums) ---
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

  // ------- Project and Position Handlers -------
  function handleProjectNameChange(pIdx: number, val: string) {
    setProjects(
      projects.map((p, i) => (i === pIdx ? { ...p, name: val } : p))
    );
  }
  function handleProjectDateChange(
    pIdx: number,
    kind: "start" | "end",
    val: string
  ) {
    setProjects(
      projects.map((p, i) =>
        i === pIdx
          ? { ...p, [kind]: new Date(val) }
          : p
      )
    );
  }

  function addProject(e: React.FormEvent) {
    e.preventDefault();
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
  function removeProject(pIdx: number) {
    setProjects(projects.filter((_, i) => i !== pIdx));
    const nextNew = { ...newPosition };
    delete nextNew[pIdx];
    setNewPosition(nextNew);
    const nextAdd = { ...showAddPosition };
    delete nextAdd[pIdx];
    setShowAddPosition(nextAdd);
  }

  function handlePositionQtyChange(
    pIdx: number,
    posIdx: number,
    qty: number
  ) {
    setProjects(
      projects.map((p, i) =>
        i === pIdx
          ? {
            ...p,
            positions: p.positions.map((pos, k) =>
              k === posIdx ? { ...pos, quantity: qty } : pos
            ),
          }
          : p
      )
    );
  }
  function handlePositionChange(
    pIdx: number,
    posIdx: number,
    field: keyof Position,
    val: string | number
  ) {
    setProjects(
      projects.map((p, i) =>
        i === pIdx
          ? {
            ...p,
            positions: p.positions.map((pos, k) =>
              k === posIdx
                ? {
                  ...pos,
                  [field]:
                    field === "start" || field === "end"
                      ? new Date(val as string)
                      : val,
                }
                : pos
            ),
          }
          : p
      )
    );
  }
  function removePosition(pIdx: number, posIdx: number) {
    setProjects(
      projects.map((p, i) =>
        i === pIdx
          ? {
            ...p,
            positions: p.positions.filter((_, k) => k !== posIdx),
          }
          : p
      )
    );
  }

  // -- Show/handle Add Position dialog state --
  function showAddPositionForm(pIdx: number) {
    setShowAddPosition((prev) => ({ ...prev, [pIdx]: true }));
    setNewPosition((prev) => ({
      ...prev,
      [pIdx]: makeDefaultNewPosition(projects[pIdx].start, projects[pIdx].end),
    }));
  }
  function cancelAddPosition(pIdx: number) {
    setShowAddPosition((prev) => ({ ...prev, [pIdx]: false }));
    setNewPosition((prev) => ({
      ...prev,
      [pIdx]: makeDefaultNewPosition(projects[pIdx].start, projects[pIdx].end),
    }));
  }

  function handleAddPositionChange(
    pIdx: number,
    field: keyof NewPositionFormState,
    val: string | number
  ) {
    setNewPosition((prev) => ({
      ...prev,
      [pIdx]: { ...prev[pIdx], [field]: val },
    }));
  }
  function addPosition(pIdx: number, e: React.FormEvent) {
    e.preventDefault();
    const np = newPosition[pIdx];
    if (!np.description.trim() || !np.type.trim() || np.quantity < 0) return;
    setProjects(
      projects.map((p, i) =>
        i === pIdx
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
              },
            ],
          }
          : p
      )
    );
    setShowAddPosition((prev) => ({ ...prev, [pIdx]: false }));
    setNewPosition((prev) => ({
      ...prev,
      [pIdx]: makeDefaultNewPosition(projects[pIdx].start, projects[pIdx].end),
    }));
  }

  // ----------------- UI -----------------
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold">Projects Timeline</h2>
        <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default" className="ml-2">
              + Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>
                Set project name and schedule.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={addProject}
              autoComplete="off"
            >
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
                <label className="flex flex-col text-sm font-medium">
                  Start
                  <Input
                    type="date"
                    required
                    value={newProject.start}
                    onChange={(e) =>
                      setNewProject({ ...newProject, start: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col text-sm font-medium">
                  End
                  <Input
                    type="date"
                    required
                    value={newProject.end}
                    min={newProject.start}
                    onChange={(e) =>
                      setNewProject({ ...newProject, end: e.target.value })
                    }
                  />
                </label>
              </div>
              <DialogFooter>
                <Button type="submit">Add</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddProject(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead>
            <tr>
              <th className="text-center font-semibold py-2 min-w-[92px]">Month</th>
              {projects.map((project, pIdx) => (
                <th key={pIdx} className="text-center font-semibold px-3 min-w-[200px]">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Input
                      className="w-32 px-2"
                      value={project.name}
                      onChange={(e) =>
                        handleProjectNameChange(pIdx, e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="ml-1"
                      title="Remove project"
                      onClick={() => removeProject(pIdx)}
                    >
                      ×
                    </Button>
                  </div>
                  <div className="flex gap-1 justify-center text-xs text-muted-foreground mb-1">
                    <Input
                      type="date"
                      className="w-24"
                      value={formatDateInput(project.start)}
                      onChange={e =>
                        handleProjectDateChange(pIdx, "start", e.target.value)
                      }
                    />
                    <span>-</span>
                    <Input
                      type="date"
                      className="w-24"
                      value={formatDateInput(project.end)}
                      min={formatDateInput(project.start)}
                      onChange={e =>
                        handleProjectDateChange(pIdx, "end", e.target.value)
                      }
                    />
                  </div>
                  <Dialog
                    open={!!showAddPosition[pIdx]}
                    onOpenChange={open =>
                      open
                        ? showAddPositionForm(pIdx)
                        : cancelAddPosition(pIdx)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="w-full mt-2"
                        size="sm"
                        variant="secondary"
                        type="button"
                      >
                        + Position
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Position</DialogTitle>
                        <DialogDescription>
                          Enter the details for the position.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        className="space-y-3"
                        autoComplete="off"
                        onSubmit={e => addPosition(pIdx, e)}
                      >
                        <Input
                          autoFocus
                          required
                          placeholder="Description"
                          value={newPosition[pIdx]?.description || ""}
                          onChange={e =>
                            handleAddPositionChange(
                              pIdx,
                              "description",
                              e.target.value
                            )
                          }
                        />
                        <Input
                          required
                          placeholder="Type"
                          value={newPosition[pIdx]?.type || ""}
                          onChange={e =>
                            handleAddPositionChange(
                              pIdx,
                              "type",
                              e.target.value
                            )
                          }
                        />
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          required
                          placeholder="Quantity"
                          value={newPosition[pIdx]?.quantity || ""}
                          onChange={e =>
                            handleAddPositionChange(
                              pIdx,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                        />
                        <div className="flex gap-2">
                          <label className="flex flex-col text-xs font-medium">
                            From
                            <Input
                              type="date"
                              required
                              value={newPosition[pIdx]?.start || ""}
                              onChange={e =>
                                handleAddPositionChange(
                                  pIdx,
                                  "start",
                                  e.target.value
                                )
                              }
                            />
                          </label>
                          <label className="flex flex-col text-xs font-medium">
                            To
                            <Input
                              type="date"
                              required
                              min={newPosition[pIdx]?.start}
                              value={newPosition[pIdx]?.end || ""}
                              onChange={e =>
                                handleAddPositionChange(
                                  pIdx,
                                  "end",
                                  e.target.value
                                )
                              }
                            />
                          </label>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Add</Button>
                          <Button type="button" variant="secondary" onClick={() => cancelAddPosition(pIdx)}>
                            Cancel
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
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
                <td
                  className="text-center font-semibold"
                >
                  {formatMonth(month)}
                </td>
                {/* Project cells by month */}
                {projects.map((project, pIdx) => {
                  const isActive = project.end >= month && project.start < addMonths(month, 1);
                  const monthPositions = project.positions
                    .map((pos, posIdx) => {
                      if (
                        pos.end >= month &&
                        pos.start < addMonths(month, 1)
                      ) {
                        return (
                          <div key={posIdx} className="flex items-center gap-1 mb-1" title={pos.description}>
                            <Input
                              className="w-16"
                              value={pos.type}
                              onChange={e =>
                                handlePositionChange(
                                  pIdx,
                                  posIdx,
                                  "type",
                                  e.target.value
                                )
                              }
                            />
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              className="w-14"
                              value={pos.quantity}
                              onChange={e =>
                                handlePositionQtyChange(
                                  pIdx,
                                  posIdx,
                                  Number(e.target.value)
                                )
                              }
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              title="Edit description"
                              onClick={() => {
                                const desc = prompt(
                                  "Edit description (shown on hover)",
                                  pos.description
                                );
                                if (desc != null) {
                                  handlePositionChange(
                                    pIdx,
                                    posIdx,
                                    "description",
                                    desc
                                  );
                                }
                              }}
                            >
                              📝
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              title="Remove position"
                              onClick={() => removePosition(pIdx, posIdx)}
                            >
                              ×
                            </Button>
                          </div>
                        );
                      }
                      return null;
                    })
                    .filter(Boolean);

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
    </div>
  );
};