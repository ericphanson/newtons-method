import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UnifiedVisualizer from './UnifiedVisualizer';

function App() {
  return (
    <BrowserRouter basename="/newtons-method">
      <Routes>
        <Route path="/" element={<UnifiedVisualizer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
