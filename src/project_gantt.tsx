import type { Project } from "./types";
import React, { useMemo, useState } from "react";

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

  // ------------ Controls/State for NEW project dialog ----------
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState<NewProjectFormState>(
    defaultNewProject
  );

  // ------------ Controls/State for NEW position (per project) ----------
  // Map: project index -> boolean (show new pos form)
  const [showAddPosition, setShowAddPosition] = useState<{
    [pIdx: number]: boolean;
  }>({});
  // Map: project index -> position draft state
  const [newPosition, setNewPosition] = useState<{
    [pIdx: number]: NewPositionFormState;
  }>({});

  // ------------------------ CALCULATIONS ---------------------
  const months = useMemo(() => {
    if (projects.length === 0) return [];
    const starts = projects.map((p) => p.start);
    const ends = projects.map((p) => p.end);
    const minD = minDate(...starts);
    const maxD = maxDate(...ends);
    const monthCount = monthDiff(minD, maxD) + 1;
    const months: Date[] = [];
    for (let i = 0; i < monthCount; ++i) {
      months.push(addMonths(minD, i));
    }
    return months;
  }, [projects]);

  const allTypes = useMemo(
    () =>
      Array.from(
        new Set(projects.flatMap((p) => p.positions.map((pos) => pos.type)))
      ),
    [projects]
  );

  // Calculate sum per type, per month (across all projects)
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

  // --------------- PROJECT OPERATIONS ---------------
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

  // ------------- PROJECT ADD/REMOVE --------------
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

  // ------------- POSITION OPERATIONS --------------
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

  // ------------- POSITION ADDING -------------
  function showAddPositionForm(pIdx: number) {
    setShowAddPosition({ ...showAddPosition, [pIdx]: true });
    setNewPosition({
      ...newPosition,
      [pIdx]: makeDefaultNewPosition(
        projects[pIdx].start,
        projects[pIdx].end
      ),
    });
  }

  function cancelAddPosition(pIdx: number) {
    setShowAddPosition({ ...showAddPosition, [pIdx]: false });
    setNewPosition({
      ...newPosition,
      [pIdx]: makeDefaultNewPosition(
        projects[pIdx].start,
        projects[pIdx].end
      ),
    });
  }

  function handleAddPositionChange(
    pIdx: number,
    field: keyof NewPositionFormState,
    val: string | number
  ) {
    setNewPosition({
      ...newPosition,
      [pIdx]: {
        ...newPosition[pIdx],
        [field]: val,
      },
    });
  }

  function addPosition(pIdx: number, e: React.FormEvent) {
    e.preventDefault();
    const np = newPosition[pIdx];
    if (
      !np.description.trim() ||
      !np.type.trim() || np.quantity < 0
    )
      return;
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
    setShowAddPosition({ ...showAddPosition, [pIdx]: false });
    setNewPosition({
      ...newPosition,
      [pIdx]: makeDefaultNewPosition(
        projects[pIdx].start,
        projects[pIdx].end
      ),
    });
  }

  // ----------------- UI -----------------

  return (
    <div className="pgantt-root">
      <h2 className="pgantt-title">
        Projects Timeline &nbsp;
        <button
          className="pgantt-btn"
          onClick={() => setShowAddProject((v) => !v)}
          style={{ fontSize: "1rem", fontWeight: 600, marginLeft: 4 }}
        >
          + Add Project
        </button>
      </h2>
      {showAddProject && (
        <form className="pgantt-addpanel" onSubmit={addProject}>
          <label>
            Name:{" "}
            <input
              required
              className="pgantt-input"
              type="text"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
            />
          </label>
          <label>
            Start:{" "}
            <input
              required
              className="pgantt-input"
              type="date"
              value={newProject.start}
              onChange={(e) =>
                setNewProject({ ...newProject, start: e.target.value })
              }
            />
          </label>
          <label>
            End:{" "}
            <input
              required
              className="pgantt-input"
              type="date"
              value={newProject.end}
              min={newProject.start}
              onChange={(e) =>
                setNewProject({ ...newProject, end: e.target.value })
              }
            />
          </label>
          <button className="pgantt-btn" type="submit">
            Add
          </button>
          <button
            className="pgantt-btn pgantt-btn-outline"
            type="button"
            onClick={() => setShowAddProject(false)}
          >
            Cancel
          </button>
        </form>
      )}

      <table className="pgantt-table">
        <thead>
          <tr>
            <th className="pgantt-th" style={{ minWidth: 92 }}>
              Month
            </th>
            {projects.map((project, pIdx) => (
              <th key={pIdx} className="pgantt-th pgantt-th-month" style={{ minWidth: 148 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    className="pgantt-projectname"
                    value={project.name}
                    onChange={(e) =>
                      handleProjectNameChange(pIdx, e.target.value)
                    }
                  />
                  <button
                    title="Remove project"
                    className="pgantt-btn pgantt-btn-danger"
                    style={{
                      fontWeight: 900,
                      marginLeft: 2,
                      fontSize: "0.97em",
                      padding: "0.1em 0.5em",
                    }}
                    onClick={() => removeProject(pIdx)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <div style={{ marginTop: 2, fontSize: "0.92em", color: "#69728c" }}>
                  <input
                    type="date"
                    className="pgantt-projectdate"
                    style={{ width: 100, marginRight: 2 }}
                    value={formatDateInput(project.start)}
                    onChange={e =>
                      handleProjectDateChange(pIdx, "start", e.target.value)
                    }
                  />
                  <span>-</span>
                  <input
                    type="date"
                    className="pgantt-projectdate"
                    style={{ width: 100, marginLeft: 2 }}
                    value={formatDateInput(project.end)}
                    min={formatDateInput(project.start)}
                    onChange={e =>
                      handleProjectDateChange(pIdx, "end", e.target.value)
                    }
                  />
                </div>
                <div style={{ textAlign: "right", marginTop: 4 }}>
                  <button
                    className="pgantt-btn pgantt-btn-sm"
                    type="button"
                    onClick={() => showAddPositionForm(pIdx)}
                  >
                    + Position
                  </button>
                </div>
                {showAddPosition[pIdx] && (
                  <form
                    className="pgantt-addpanel pgantt-addpanel-pos"
                    style={{ marginTop: 2, marginBottom: -6, fontSize: "0.89em" }}
                    onSubmit={e => addPosition(pIdx, e)}
                  >
                    <label>
                      <input
                        className="pgantt-input"
                        placeholder="Description"
                        type="text"
                        value={newPosition[pIdx]?.description || ""}
                        onChange={e =>
                          handleAddPositionChange(
                            pIdx,
                            "description",
                            e.target.value
                          )
                        }
                        required
                      />
                    </label>
                    <label>
                      Type:{" "}
                      <input
                        className="pgantt-input"
                        placeholder="Type"
                        type="text"
                        value={newPosition[pIdx]?.type || ""}
                        onChange={e =>
                          handleAddPositionChange(
                            pIdx,
                            "type",
                            e.target.value
                          )
                        }
                        required
                      />
                    </label>
                    <label>
                      Qty:{" "}
                      <input
                        className="pgantt-input"
                        style={{ width: "3em" }}
                        type="number"
                        min={0}
                        step={0.01}
                        value={newPosition[pIdx]?.quantity || 0}
                        onChange={e =>
                          handleAddPositionChange(
                            pIdx,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                        required
                      />
                    </label>
                    <label>
                      From:{" "}
                      <input
                        className="pgantt-input"
                        type="date"
                        value={newPosition[pIdx]?.start || ""}
                        onChange={e =>
                          handleAddPositionChange(
                            pIdx,
                            "start",
                            e.target.value
                          )
                        }
                        required
                      />
                    </label>
                    <label>
                      To:{" "}
                      <input
                        className="pgantt-input"
                        type="date"
                        value={newPosition[pIdx]?.end || ""}
                        min={newPosition[pIdx]?.start}
                        onChange={e =>
                          handleAddPositionChange(
                            pIdx,
                            "end",
                            e.target.value
                          )
                        }
                        required
                      />
                    </label>
                    <button className="pgantt-btn pgantt-btn-sm" type="submit">
                      Add
                    </button>
                    <button
                      className="pgantt-btn pgantt-btn-sm pgantt-btn-outline"
                      type="button"
                      onClick={() => cancelAddPosition(pIdx)}
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </th>
            ))}
            <th className="pgantt-th" style={{ width: 130 }}>
              Sum per type
            </th>
          </tr>
        </thead>
        <tbody>
          {months.map((month, mIdx) => (
            <tr
              key={mIdx}
              className={mIdx % 2 === 1 ? "pgantt-tr-odd" : undefined}
            >
              {/* Y label: Month */}
              <td
                className="pgantt-td pgantt-td-name"
                style={{ textAlign: "center", fontWeight: 600 }}
              >
                {formatMonth(month)}
              </td>
              {/* Project cells */}
              {projects.map((project, pIdx) => {
                const isActive =
                  project.end >= month && project.start < addMonths(month, 1);

                // Find all positions for this project and month
                const monthPositions = project.positions
                  .map((pos, posIdx) => {
                    if (
                      pos.end >= month &&
                      pos.start < addMonths(month, 1)
                    ) {
                      return (
                        <div key={posIdx} className="pgantt-posbar" title={pos.description}>
                          <span title={pos.description}>
                            <input
                              className="pgantt-pos-type"
                              value={pos.type}
                              style={{ width: 56 }}
                              onChange={e =>
                                handlePositionChange(
                                  pIdx,
                                  posIdx,
                                  "type",
                                  e.target.value
                                )
                              }
                            />
                          </span>
                          <input
                            className="pgantt-posqty"
                            type="number"
                            min={0}
                            step={0.01}
                            value={pos.quantity}
                            onChange={e =>
                              handlePositionQtyChange(
                                pIdx,
                                posIdx,
                                Number(e.target.value)
                              )
                            }
                            style={{ width: 48, marginLeft: 2 }}
                          />
                          <button
                            type="button"
                            title="Edit description"
                            className="pgantt-btn pgantt-btn-xs"
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
                            style={{ marginLeft: 4 }}
                          >
                            📝
                          </button>
                          <button
                            type="button"
                            title="Remove position"
                            className="pgantt-btn pgantt-btn-xs pgantt-btn-danger"
                            onClick={() => removePosition(pIdx, posIdx)}
                            style={{ marginLeft: 4 }}
                          >
                            ×
                          </button>
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
                      "pgantt-td pgantt-td-month" +
                      (!isActive ? " pgantt-td-inactive" : "")
                    }
                  >
                    {monthPositions.length > 0
                      ? monthPositions
                      : null}
                  </td>
                );
              })}
              {/* Sum per type cell */}
              <td className="pgantt-td pgantt-td-sum">
                {allTypes.map((type, tIdx) => {
                  const sum = sumPerTypePerMonth[`${tIdx}_${mIdx}`] || 0;
                  return (
                    <div key={type} className="pgantt-sumrow">
                      <span className="pgantt-sumtype">{type}</span>
                      <span
                        className={
                          sum
                            ? "pgantt-sumval"
                            : "pgantt-sumval pgantt-sumval-inactive"
                        }
                      >
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
};