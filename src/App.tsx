import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import NewtonVisualizer from './newton-visualizer';
import LBFGSVisualizer from './lbfgs-visualizer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/newton" element={<NewtonVisualizer />} />
        <Route path="/lbfgs" element={<LBFGSVisualizer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
