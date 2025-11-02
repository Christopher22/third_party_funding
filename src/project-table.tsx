import {
    CalendarDays,
    Clock,
    UserPlus,
    Tag,
    Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge"

import { MonthYear } from "@/lib/month-year";
import type { Project } from "@/lib/types";

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
        <div className="overflow-x-auto flex justify-center w-full">
            <Table className="min-w-fit w-max">
                <TableCaption>
                    <CalendarDays className="inline mb-1 mr-2" size={17} />
                    Project positions by month, type and project.
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center min-w-[100px] w-[100px] max-w-[100px]">
                            <Clock className="mb-0.5 mr-1 inline" size={15} />
                            Month
                        </TableHead>
                        {projects.map((project, pIdx) => (
                            <TableHead key={pIdx} className="min-w-[200px] w-[200px] max-w-[200px]">
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
                                        <ItemDescription className="flex flex-col">
                                            {project.funded && (
                                                <Badge variant="outline">
                                                    Funded
                                                </Badge>
                                            )}
                                            <span>{`${project.start.toShortString()} - ${project.end.toShortString()}`}</span>
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
                        <TableHead className="text-center min-w-[150px] w-[150px] max-w-[150px]">
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
                                    <TableCell className="text-center font-semibold min-w-[100px] w-[100px] max-w-[100px]">
                                        {month.toShortString()}
                                    </TableCell>
                                    {projects.map((project, pIdx) => (
                                        <TableCell key={pIdx} className="align-top min-w-[200px] w-[200px] max-w-[200px]">
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
                                    <TableCell className="align-top min-w-[150px] w-[150px] max-w-[150px]">
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