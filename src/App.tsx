import { ProjectGantt } from './project_gantt'
import { type Project } from './lib/types'
import './App.css'

function App() {
  const exampleProjects: Project[] = [];
  return (
    <ProjectGantt initialProjects={exampleProjects} />
  );
}

export default App;
