import {
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
  downloadStringAsFile,
} from "@/lib/serialization";


export function ProjectGantt({ initialProjects }: { initialProjects: Project[] }) {
  function loadData(data: unknown): MonthYear {
    if (data instanceof MonthYear) {
      return data;
    } else if (typeof data === "string") {
      return MonthYear.fromString(data);
    } else if (data && typeof data === "object" && "year" in data && "month" in data) {
      return new MonthYear(
        (data as { year: number; month: number }).year,
        (data as { year: number; month: number }).month
      );
    } else {
      throw new Error("Invalid MonthYear data");
    }
  }

  // Set up the projects state, and ensure funded is present (default false if not)
  const fixDates = (proj: Project): Project => ({
    ...proj,
    start: loadData(proj.start),
    end: loadData(proj.end),
    positions: proj.positions.map((pos) => ({
      ...pos,
      start: loadData(pos.start),
      end: loadData(pos.end),
      quantity:
        typeof pos.quantity === "number"
          ? pos.quantity
          : Number(pos.quantity) || 0,
    })),
    funded: proj.funded ?? false,
  });

  const [projects, setProjects] = useState<Project[]>(
    initialProjects.map(fixDates)
  );
  const [showOnlyFunded, setShowOnlyFunded] = useState(false);

  const [sheet, setSheet] = useState<EditSheetState>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const defaultMonth = MonthYear.today();
  const defaultEnd = defaultMonth.addMonths(5);
  const defaultNewProject: ProjectInput = {
    name: "",
    start: defaultMonth,
    end: defaultEnd,
    funded: false,
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
  const [addPosProjectIdx, setAddPosProjectIdx] = useState<number | null>(null);
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

  const projectsFiltered = showOnlyFunded
    ? projects.filter((p) => p.funded)
    : projects;

  const sumPerTypePerMonth = useMemo(() => {
    const result: Record<string, number> = {};
    months.forEach((month, mIdx) => {
      projectsFiltered.forEach((project) => {
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
  }, [projectsFiltered, months, typeIndex]);

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
        funded: p.funded,
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
              funded: !!sheet.values.funded,
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
    const { name, start, end, funded } = newProject;
    if (!name.trim()) return;
    setProjects([
      ...projects,
      { name: name.trim(), start, end, funded: !!funded, positions: [] },
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
      <div className="flex items-center gap-2 flex-wrap">
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
        projects={projectsFiltered}
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