import { createContext } from 'react';

// Context to track which variable is currently hovered
export interface PseudocodeContextType {
  hoveredVar: string | null;
  setHoveredVar: (id: string | null) => void;
}

export const PseudocodeContext = createContext<PseudocodeContextType>({
  hoveredVar: null,
  setHoveredVar: () => {},
});
