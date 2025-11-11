import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UnifiedVisualizer from './UnifiedVisualizer';
import { PseudocodeContext } from './components/Pseudocode';

function App() {
  const [hoveredVar, setHoveredVar] = useState<string | null>(null);

  return (
    <PseudocodeContext.Provider value={{ hoveredVar, setHoveredVar }}>
      <BrowserRouter basename="/newtons-method">
        <Routes>
          <Route path="/" element={<UnifiedVisualizer />} />
        </Routes>
      </BrowserRouter>
    </PseudocodeContext.Provider>
  );
}

export default App;
