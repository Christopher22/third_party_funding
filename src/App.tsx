import { ProjectGantt, type Project } from './project_gantt'
import './App.css'

function App() {
  const exampleProjects: Project[] = [];
  return (
    <ProjectGantt initialProjects={exampleProjects} />
  );
}

export default App;
