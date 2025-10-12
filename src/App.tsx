import { ProjectGantt, type Project, MonthYear } from './project_gantt'
import './App.css'

function App() {
  const exampleProjects: Project[] = [
  {
    name: "AI Research",
    start: new MonthYear(2025, 1),
    end: new MonthYear(2025, 6),
    positions: [
      {
        description: "Postdoc, full time",
        quantity: 1,
        type: "Postdoc",
        start: new MonthYear(2025, 1),
        end: new MonthYear(2026, 6),
      },
      {
        description: "PhD, part time",
        quantity: 0.5,
        type: "PhD",
        start: new MonthYear(2025, 1),
        end: new MonthYear(2026, 3),
      },
    ],
  },
  {
    name: "Software Project",
    start: new MonthYear(2024, 5),
    end: new MonthYear(2026, 12),
    positions: [
      {
        description: "Developer",
        quantity: 2,
        type: "Dev",
        start: new MonthYear(2024, 5),
        end: new MonthYear(2024, 9),
      },
      {
        description: "Manager, part time",
        quantity: 0.2,
        type: "Manager",
        start: new MonthYear(2024, 5),
        end: new MonthYear(2024, 11),
      },
    ],
  },
];

  return (
    <ProjectGantt initialProjects={exampleProjects} />
  );
}

export default App;
