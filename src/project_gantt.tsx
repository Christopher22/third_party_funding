import React, {
  useMemo,
  useState,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from "react";

import {
  CalendarDays,
  Save,
  UploadCloud,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { MonthYear } from "@/lib/month-year";
import type { Project, ProjectInput, Position } from "@/lib/types";
import { AddProjectDialog } from "@/add-project-dialog";
import { AddPositionDialog } from "@/add-position-dialog";
import { ProjectTable } from "@/project-table";
import { EditSheet, type EditSheetState } from "@/edit-sheet";
import {
  projectsFromSerializable,
  projectsToSerializable,
  downloadStringAsFile
} from "@/lib/serialization";


function createDefaultPosition(start: MonthYear, end: MonthYear): Position {
  return {
    description: "",
    quantity: 1,
    type: "",
    start,
    end,
  };
}

export function ProjectGantt({ initialProjects }: { initialProjects: Project[] }) {
  // State
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showOnlyFunded, setShowOnlyFunded] = useState(false);

  // Edit Sheet State
  const [editSheet, setEditSheet] = useState<EditSheetState>(null);
  const [isEditSheetOpen, setEditSheetOpen] = useState(false);

  // Add Project State
  const defaultMonth = MonthYear.today();
  const defaultEndMonth = defaultMonth.addMonths(5);
  const defaultProjectInput: ProjectInput = {
    name: "",
    start: defaultMonth,
    end: defaultEndMonth,
    funded: false,
  };
  const [isAddProjectOpen, setAddProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState<ProjectInput>(defaultProjectInput);

  // Add Position State
  const [isAddPositionOpen, setAddPositionOpen] = useState(false);
  const [addPosProjectIdx, setAddPosProjectIdx] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState<Position>(
    createDefaultPosition(defaultMonth, defaultEndMonth)
  );

  // Timeline filter
  const [onlyFuture, setOnlyFuture] = useState(true);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- Memoized Derivations ----------
  const today = MonthYear.today();

  const filteredProjects = useMemo(
    () => (showOnlyFunded ? projects.filter((p) => p.funded) : projects),
    [projects, showOnlyFunded]
  );

  const allTypes = useMemo(
    () =>
      Array.from(
        new Set(projects.flatMap((p) => p.positions.map((pos) => pos.type)))
      ),
    [projects]
  );
  const typeIndex = useMemo(
    () => new Map<string, number>(allTypes.map((type, i) => [type, i])),
    [allTypes]
  );

  // Months column generator
  const timelineMonths = useMemo(() => {
    if (projects.length === 0) return [];
    let minMonth = projects[0].start;
    let maxMonth = projects[0].end;
    for (const p of projects) {
      if (p.start.isBefore(minMonth)) minMonth = p.start;
      if (p.end.isAfter(maxMonth)) maxMonth = p.end;
    }
    if (onlyFuture && today.isAfter(minMonth)) minMonth = today;
    const months: MonthYear[] = [];
    for (let ym = minMonth; !ym.isAfter(maxMonth); ym = ym.addMonths(1)) {
      months.push(ym);
    }
    return months;
  }, [projects, onlyFuture, today]);

  // Project/Position quantity matrix (per type per month)
  const sumPerTypePerMonth = useMemo(() => {
    const result: Record<string, number> = {};
    timelineMonths.forEach((month, mIdx) => {
      filteredProjects.forEach((project) => {
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
  }, [filteredProjects, timelineMonths, typeIndex]);

  // ---------- Callbacks & Handlers ----------

  // ----------- Save & Load -----------

  const handleSaveProjects = () => {
    const data = JSON.stringify(projectsToSerializable(projects), null, 2);
    downloadStringAsFile(data, `projects-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleLoadProjects = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        setProjects(projectsFromSerializable(raw));
        setEditSheet(null);
        setEditSheetOpen(false);
      } catch (err) {
        alert("Failed to load projects: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be uploaded multiple times
    event.target.value = "";
  };

  // ----------- Sheet Edit -----------
  const openProjectEditSheet = (projectIdx: number) => {
    const p = projects[projectIdx];
    setEditSheet({
      type: "project",
      projectIdx,
      values: { name: p.name, start: p.start, end: p.end, funded: p.funded },
    });
    setEditSheetOpen(true);
  };
  const openPositionEditSheet = (projectIdx: number, positionIdx: number) => {
    const pos = projects[projectIdx].positions[positionIdx];
    setEditSheet({
      type: "position",
      projectIdx,
      positionIdx,
      values: { ...pos },
    });
    setEditSheetOpen(true);
  };
  const closeEditSheet = () => {
    setEditSheetOpen(false);
    setEditSheet(null);
  };

  const saveSheetEdit = () => {
    if (!editSheet) return closeEditSheet();
    setProjects((prev) => {
      if (editSheet.type === "project") {
        return prev.map((p, idx) =>
          idx === editSheet.projectIdx
            ? {
              ...p,
              ...editSheet.values,
              funded: !!editSheet.values.funded,
            }
            : p
        );
      } else {
        return prev.map((p, idx) =>
          idx === editSheet.projectIdx
            ? {
              ...p,
              positions: p.positions.map((pos, posIdx) =>
                posIdx === editSheet.positionIdx ? { ...editSheet.values } : pos
              ),
            }
            : p
        );
      }
    });
    closeEditSheet();
  };

  const deleteSheetEdit = () => {
    if (!editSheet) return closeEditSheet();
    if (editSheet.type === "project") {
      if (
        window.confirm(
          `Delete project "${projects[editSheet.projectIdx]?.name}" and all its positions?`
        )
      ) {
        setProjects((prev) =>
          prev.filter((_, idx) => idx !== editSheet.projectIdx)
        );
        closeEditSheet();
      }
    } else {
      if (window.confirm("Delete this position?")) {
        setProjects((prev) =>
          prev.map((p, idx) =>
            idx === editSheet.projectIdx
              ? {
                ...p,
                positions: p.positions.filter(
                  (_, posIdx) => posIdx !== editSheet.positionIdx
                ),
              }
              : p
          )
        );
        closeEditSheet();
      }
    }
  };

  // ----------- Add Project & Position Handlers -----------

  const handleAddProject: React.FormEventHandler = (ev) => {
    ev.preventDefault();
    const { name, start, end, funded } = newProject;
    if (!name.trim()) return;
    setProjects((prev) => [
      ...prev,
      { name: name.trim(), start, end, funded: !!funded, positions: [] },
    ]);
    setAddProjectOpen(false);
    setNewProject(defaultProjectInput);
  };

  const handleAddPositionSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (addPosProjectIdx == null) return;
    const { description, type, quantity, start, end } = newPosition;
    if (!description.trim() || !type.trim() || quantity < 0) return;
    setProjects((prev) =>
      prev.map((p, idx) =>
        idx === addPosProjectIdx
          ? {
            ...p,
            positions: [...p.positions, { description, type, quantity, start, end }],
          }
          : p
      )
    );
    setAddPositionOpen(false);
    setNewPosition(createDefaultPosition(
      projects[addPosProjectIdx].start,
      projects[addPosProjectIdx].end
    ));
  };

  const handleAddPositionClick = (projectIdx: number) => {
    setAddPosProjectIdx(projectIdx);
    setAddPositionOpen(true);
    setNewPosition(
      createDefaultPosition(
        projects[projectIdx].start,
        projects[projectIdx].end
      )
    );
  };

  // ----------- Selection Information -----------
  const selectedProjectIdx = editSheet && ('projectIdx' in editSheet) ? editSheet.projectIdx : null;
  const selectedPositionIdx = editSheet && editSheet.type === "position" ? editSheet.positionIdx : null;

  // ---------- Render ----------

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-2xl font-semibold flex items-center">
          <CalendarDays className="mb-0.5 mr-2" size={23} />
          Projects Timeline
        </h2>

        <AddProjectDialog
          open={isAddProjectOpen}
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

        <div className="flex items-center gap-2 ml-4">
          <Switch
            checked={showOnlyFunded}
            onCheckedChange={setShowOnlyFunded}
            id="show-funded-switch"
          />
          <label
            htmlFor="show-funded-switch"
            className="ml-1 flex items-center"
          >
            Show only funded projects
          </label>
        </div>
      </div>

      <ProjectTable
        projects={filteredProjects}
        months={timelineMonths}
        allTypes={allTypes}
        sumPerTypePerMonth={sumPerTypePerMonth}
        onProjectClick={openProjectEditSheet}
        onPositionClick={openPositionEditSheet}
        onAddPositionClick={handleAddPositionClick}
        selectedProjectIdx={selectedProjectIdx}
        selectedPositionIdx={selectedPositionIdx}
      />

      <AddPositionDialog
        open={isAddPositionOpen}
        onOpenChange={setAddPositionOpen}
        newPosition={newPosition}
        setNewPosition={setNewPosition}
        onAdd={handleAddPositionSubmit}
        allTypes={allTypes}
      />

      <EditSheet
        open={isEditSheetOpen}
        onOpenChange={(open) => {
          if (!open) closeEditSheet();
        }}
        sheet={editSheet}
        setSheet={setEditSheet}
        onSave={saveSheetEdit}
        onDelete={deleteSheetEdit}
        allTypes={allTypes}
      />
    </div>
  );
}