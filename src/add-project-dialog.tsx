import {
    type FormEvent,
} from "react";

import {
    PlusCircle,
    FolderPlus,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

import { MonthPicker } from "@/components/month-picker";
import { type ProjectInput } from "@/lib/types";

export function AddProjectDialog({
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
                    <div className="flex items-center gap-2 mt-2">
                        <Switch
                            id="add-funded-switch"
                            checked={!!newProject.funded}
                            onCheckedChange={v => setNewProject({ ...newProject, funded: v })}
                        />
                        <label htmlFor="add-funded-switch" className="ml-1">
                            Funded
                        </label>
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