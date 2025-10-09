import { ProjectGantt } from './project_gantt'
import type { Project } from './types'
import './App.css'

function App() {
  const exampleProjects: Project[] = [
  {
    name: "AI Research",
    start: new Date("2024-01-01"),
    end: new Date("2024-06-30"),
    positions: [
      {
        description: "Postdoc, full time",
        quantity: 1,
        type: "Postdoc",
        start: new Date("2024-01-01"),
        end: new Date("2024-06-30"),
      },
      {
        description: "PhD, part time",
        quantity: 0.5,
        type: "PhD",
        start: new Date("2024-03-01"),
        end: new Date("2024-06-30"),
      },
    ],
  },
  {
    name: "Software Project",
    start: new Date("2024-05-01"),
    end: new Date("2024-12-31"),
    positions: [
      {
        description: "Developer",
        quantity: 2,
        type: "Dev",
        start: new Date("2024-05-01"),
        end: new Date("2024-09-30"),
      },
      {
        description: "Manager, part time",
        quantity: 0.2,
        type: "Manager",
        start: new Date("2024-05-01"),
        end: new Date("2024-11-30"),
      },
    ],
  },
];

  return (
    <ProjectGantt initialProjects={exampleProjects} />
  );
}

export default App;
