# 3D Objective Function Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add interactive 3D surface plots of objective functions with trajectory overlay using Three.js

**Architecture:** Create a React component that renders objective function surfaces as 3D meshes using Three.js. The surface will be color-mapped by loss value, with the optimization trajectory overlaid as a 3D line and current point as a sphere marker. Component integrates alongside existing 2D parameter space visualization with toggle control.

**Tech Stack:** Three.js, React, TypeScript, @react-three/fiber (React wrapper for Three.js), @react-three/drei (Three.js helpers)

---

## Background Context

**Current State:**
- Parameter space shows 2D contour plots (heatmaps) via canvas
- Located in UnifiedVisualizer.tsx (~line 2500-2700)
- Each algorithm has its own parameter space canvas
- Uses `getProblem()` to get objective function
- Iterations stored in state (e.g., `gdFixedIterations`)

**New Feature:**
- Add 3D surface plot option for each algorithm
- Show f(w₀, w₁) as a surface mesh
- Overlay trajectory path as 3D line
- Mark current iteration point
- Interactive camera (rotate, zoom, pan)

---

## Task 1: Install Three.js Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Three.js packages**

```bash
npm install three@latest @types/three@latest @react-three/fiber@latest @react-three/drei@latest
```

Expected output: Packages installed successfully

**Step 2: Verify installation**

```bash
npm list three @react-three/fiber @react-three/drei
```

Expected: Shows installed versions (three@0.160+, fiber@8.15+, drei@9.96+)

**Step 3: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add Three.js and React Three Fiber for 3D visualization"
```

---

## Task 2: Create 3D Surface Mesh Generator Utility

**Files:**
- Create: `src/utils/surfaceMeshGenerator.ts`

**Purpose:** Generate mesh geometry for objective function surfaces

**Step 1: Create the mesh generator file**

```typescript
// src/utils/surfaceMeshGenerator.ts

/**
 * Generate mesh data for 3D surface plot of objective function
 *
 * @param objectiveFn - Function that takes [w0, w1] and returns loss value
 * @param bounds - Domain bounds {w0: [min, max], w1: [min, max]}
 * @param resolution - Grid resolution (default: 50x50)
 * @returns Mesh data with positions and color values
 */
export interface SurfaceMeshData {
  positions: Float32Array; // Vertex positions [x, y, z, x, y, z, ...]
  colors: Float32Array;    // Vertex colors [r, g, b, r, g, b, ...]
  indices: Uint16Array;    // Triangle indices
  minZ: number;            // Minimum z (loss) value
  maxZ: number;            // Maximum z (loss) value
}

export function generateSurfaceMesh(
  objectiveFn: (w: number[]) => number,
  bounds: { w0: [number, number]; w1: [number, number] },
  resolution: number = 50
): SurfaceMeshData {
  const [w0Min, w0Max] = bounds.w0;
  const [w1Min, w1Max] = bounds.w1;

  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const zValues: number[] = [];

  // Generate grid vertices
  for (let i = 0; i <= resolution; i++) {
    const w1 = w1Min + (i / resolution) * (w1Max - w1Min);

    for (let j = 0; j <= resolution; j++) {
      const w0 = w0Min + (j / resolution) * (w0Max - w0Min);

      // Evaluate objective function
      const z = objectiveFn([w0, w1]);
      zValues.push(z);

      // Add vertex position (x=w0, y=w1, z=loss)
      vertices.push(w0, w1, z);

      // Color will be set after we know min/max z
      colors.push(0, 0, 0);
    }
  }

  // Find min/max z for color mapping
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);
  const zRange = maxZ - minZ || 1; // Avoid division by zero

  // Set colors based on z value (blue=low, red=high)
  for (let i = 0; i < zValues.length; i++) {
    const normalizedZ = (zValues[i] - minZ) / zRange;

    // Color map: blue (low) -> cyan -> green -> yellow -> red (high)
    let r = 0, g = 0, b = 1;

    if (normalizedZ < 0.25) {
      // Blue to cyan
      const t = normalizedZ / 0.25;
      r = 0;
      g = t;
      b = 1;
    } else if (normalizedZ < 0.5) {
      // Cyan to green
      const t = (normalizedZ - 0.25) / 0.25;
      r = 0;
      g = 1;
      b = 1 - t;
    } else if (normalizedZ < 0.75) {
      // Green to yellow
      const t = (normalizedZ - 0.5) / 0.25;
      r = t;
      g = 1;
      b = 0;
    } else {
      // Yellow to red
      const t = (normalizedZ - 0.75) / 0.25;
      r = 1;
      g = 1 - t;
      b = 0;
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  // Generate triangle indices
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const a = i * (resolution + 1) + j;
      const b = a + 1;
      const c = a + (resolution + 1);
      const d = c + 1;

      // Two triangles per quad
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  return {
    positions: new Float32Array(vertices),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
    minZ,
    maxZ,
  };
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/utils/surfaceMeshGenerator.ts
git commit -m "feat(utils): add 3D surface mesh generator for objective functions"
```

---

## Task 3: Create ObjectiveFunction3D Component

**Files:**
- Create: `src/components/ObjectiveFunction3D.tsx`

**Purpose:** React component that renders 3D surface using Three.js

**Step 1: Create the component file**

```typescript
// src/components/ObjectiveFunction3D.tsx

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { generateSurfaceMesh } from '../utils/surfaceMeshGenerator';

interface ObjectiveFunction3DProps {
  objectiveFn: (w: number[]) => number;
  bounds: { w0: [number, number]; w1: [number, number] };
  trajectory?: number[][]; // Array of [w0, w1, loss] points
  currentIter?: number;
  width?: number;
  height?: number;
}

function Surface({ meshData }: { meshData: ReturnType<typeof generateSurfaceMesh> }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(meshData.colors, 3));
    geom.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
    geom.computeVertexNormals();
    return geom;
  }, [meshData]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

function Trajectory({ points, currentIter }: { points: number[][], currentIter?: number }) {
  const linePoints = useMemo(() => {
    const endIdx = currentIter !== undefined ? currentIter + 1 : points.length;
    return points.slice(0, endIdx).map(p => new THREE.Vector3(p[0], p[1], p[2]));
  }, [points, currentIter]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(linePoints);
    return geom;
  }, [linePoints]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#ff00ff" linewidth={2} />
    </line>
  );
}

function CurrentPoint({ position }: { position: [number, number, number] }) {
  const sphereRef = useRef<THREE.Mesh>(null);

  // Gentle pulsing animation
  useFrame(({ clock }) => {
    if (sphereRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
      sphereRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={sphereRef} position={position}>
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
    </mesh>
  );
}

export function ObjectiveFunction3D({
  objectiveFn,
  bounds,
  trajectory = [],
  currentIter,
  width = 600,
  height = 500,
}: ObjectiveFunction3DProps) {
  // Generate mesh data
  const meshData = useMemo(() => {
    return generateSurfaceMesh(objectiveFn, bounds, 50);
  }, [objectiveFn, bounds]);

  // Compute camera position based on bounds
  const cameraPosition = useMemo(() => {
    const w0Center = (bounds.w0[0] + bounds.w0[1]) / 2;
    const w1Center = (bounds.w1[0] + bounds.w1[1]) / 2;
    const zRange = meshData.maxZ - meshData.minZ;
    return [
      w0Center + 3,
      w1Center + 3,
      meshData.minZ + zRange * 2,
    ] as [number, number, number];
  }, [bounds, meshData]);

  // Get current point if available
  const currentPoint = useMemo(() => {
    if (trajectory.length === 0 || currentIter === undefined) return null;
    if (currentIter >= trajectory.length) return null;
    return trajectory[currentIter] as [number, number, number];
  }, [trajectory, currentIter]);

  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{
          position: cameraPosition,
          fov: 50,
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, 5]} intensity={0.5} />

        <Surface meshData={meshData} />

        {trajectory.length > 0 && (
          <Trajectory points={trajectory} currentIter={currentIter} />
        )}

        {currentPoint && <CurrentPoint position={currentPoint} />}

        <Grid
          args={[20, 20]}
          position={[0, 0, meshData.minZ - 0.1]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#888888"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#444444"
          fadeDistance={50}
          fadeStrength={1}
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={20}
        />

        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ObjectiveFunction3D.tsx
git commit -m "feat(components): add ObjectiveFunction3D component with Three.js"
```

---

## Task 4: Add 2D/3D Toggle State to UnifiedVisualizer

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add visualization mode state**

Find the state declarations section (around line 100-200) and add:

```typescript
// Add after other state declarations
const [visualizationMode, setVisualizationMode] = useState<'2d' | '3d'>('2d');
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(ui): add visualization mode state for 2D/3D toggle"
```

---

## Task 5: Integrate 3D Visualization for Gradient Descent (Fixed)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Import ObjectiveFunction3D component**

Add to imports section (around line 1-20):

```typescript
import { ObjectiveFunction3D } from './components/ObjectiveFunction3D';
```

**Step 2: Prepare trajectory data for 3D**

Find the GD Fixed parameter space section (search for "Parameter Space (Loss Landscape)" in GD Fixed tab).

Add helper to convert iterations to 3D trajectory (around line 1800):

```typescript
// Helper: Convert iterations to 3D points [w0, w1, loss]
const gdFixed3DTrajectory = useMemo(() => {
  if (!gdFixedIterations || gdFixedIterations.length === 0) return [];

  const problem = getCurrentProblem();
  return gdFixedIterations.map(iter => {
    const w = iter.wNew;
    // For 3D problems (logistic regression), use only first 2 dimensions
    const w0 = w[0];
    const w1 = w[1];
    const loss = iter.loss;
    return [w0, w1, loss];
  });
}, [gdFixedIterations, getCurrentProblem]);
```

**Step 3: Add toggle button and conditional rendering**

Find the GD Fixed parameter space canvas section (around line 1850-2000).

Replace the canvas section with:

```typescript
{/* Parameter Space Visualization */}
<div className="mb-4">
  <div className="flex justify-between items-center mb-2">
    <h3 className="text-md font-semibold text-gray-800">Parameter Space</h3>
    <div className="flex gap-2">
      <button
        onClick={() => setVisualizationMode('2d')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationMode === '2d'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        2D Contour
      </button>
      <button
        onClick={() => setVisualizationMode('3d')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationMode === '3d'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        3D Surface
      </button>
    </div>
  </div>

  {visualizationMode === '2d' ? (
    <canvas
      ref={gdFixedParamCanvasRef}
      style={{width: '600px', height: '400px'}}
      className="border border-gray-300 rounded"
    />
  ) : (
    <ObjectiveFunction3D
      objectiveFn={(w) => {
        try {
          const problemFuncs = getCurrentProblemFunctions();
          return problemFuncs.objective(w);
        } catch {
          return 0;
        }
      }}
      bounds={visualizationBounds}
      trajectory={gdFixed3DTrajectory}
      currentIter={gdFixedCurrentIter}
      width={600}
      height={400}
    />
  )}
</div>
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 5: Test in browser**

```bash
npm run dev
```

Manual test:
1. Open localhost:5173
2. Go to Gradient Descent (Fixed) tab
3. Click "3D Surface" button
4. Verify: 3D surface appears with color-mapped landscape
5. Click and drag to rotate camera
6. Scroll to zoom
7. Step through iterations - green dot should move along trajectory

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(gd-fixed): integrate 3D surface visualization with trajectory"
```

---

## Task 6: Add 3D Visualization for Remaining Algorithms

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add 3D trajectories for GD Line Search, Newton, L-BFGS**

Add after the gdFixed3DTrajectory helper (around line 1810):

```typescript
// GD Line Search 3D trajectory
const gdLS3DTrajectory = useMemo(() => {
  if (!gdLSIterations || gdLSIterations.length === 0) return [];
  return gdLSIterations.map(iter => [iter.wNew[0], iter.wNew[1], iter.loss]);
}, [gdLSIterations]);

// Newton 3D trajectory
const newton3DTrajectory = useMemo(() => {
  if (!newtonIterations || newtonIterations.length === 0) return [];
  return newtonIterations.map(iter => [iter.wNew[0], iter.wNew[1], iter.loss]);
}, [newtonIterations]);

// L-BFGS 3D trajectory
const lbfgs3DTrajectory = useMemo(() => {
  if (!lbfgsIterations || lbfgsIterations.length === 0) return [];
  return lbfgsIterations.map(iter => [iter.wNew[0], iter.wNew[1], iter.loss]);
}, [lbfgsIterations]);
```

**Step 2: Update GD Line Search parameter space section**

Find GD Line Search parameter space canvas (search for "gdLSParamCanvasRef").

Replace with same toggle pattern as GD Fixed:

```typescript
{/* Parameter Space Visualization */}
<div className="mb-4">
  <div className="flex justify-between items-center mb-2">
    <h3 className="text-md font-semibold text-gray-800">Parameter Space</h3>
    <div className="flex gap-2">
      <button
        onClick={() => setVisualizationMode('2d')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationMode === '2d' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        2D Contour
      </button>
      <button
        onClick={() => setVisualizationMode('3d')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationMode === '3d' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        3D Surface
      </button>
    </div>
  </div>

  {visualizationMode === '2d' ? (
    <canvas
      ref={gdLSParamCanvasRef}
      style={{width: '600px', height: '400px'}}
      className="border border-gray-300 rounded"
    />
  ) : (
    <ObjectiveFunction3D
      objectiveFn={(w) => {
        try {
          const problemFuncs = getCurrentProblemFunctions();
          return problemFuncs.objective(w);
        } catch {
          return 0;
        }
      }}
      bounds={visualizationBounds}
      trajectory={gdLS3DTrajectory}
      currentIter={gdLSCurrentIter}
      width={600}
      height={400}
    />
  )}
</div>
```

**Step 3: Update Newton parameter space section**

Same pattern for Newton (search for "newtonParamCanvasRef"), use orange color:

```typescript
{/* Parameter Space Visualization */}
<div className="mb-4">
  <div className="flex justify-between items-center mb-2">
    <h3 className="text-md font-semibold text-gray-800">Parameter Space</h3>
    <div className="flex gap-2">
      <button
        onClick={() => setVisualizationMode('2d')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationMode === '2d' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        2D Contour
      </button>
      <button
        onClick={() => setVisualizationMode('3d')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationMode === '3d' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        3D Surface
      </button>
    </div>
  </div>

  {visualizationMode === '2d' ? (
    <canvas
      ref={newtonParamCanvasRef}
      style={{width: '600px', height: '400px'}}
      className="border border-gray-300 rounded"
    />
  ) : (
    <ObjectiveFunction3D
      objectiveFn={(w) => {
        try {
          const problemFuncs = getCurrentProblemFunctions();
          return problemFuncs.objective(w);
        } catch {
          return 0;
        }
      }}
      bounds={visualizationBounds}
      trajectory={newton3DTrajectory}
      currentIter={newtonCurrentIter}
      width={600}
      height={400}
    />
  )}
</div>
```

**Step 4: Update L-BFGS parameter space section**

Same pattern for L-BFGS (search for "lbfgsParamCanvasRef"), use purple color:

```typescript
{/* Parameter Space Visualization */}
<div className="mb-4">
  <div className="flex justify-between items-center mb-2">
    <h3 className="text-md font-semibold text-gray-800">Parameter Space</h3>
    <div className="flex gap-2">
      <button
        onClick={() => setVisualizationMode('2d')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationMode === '2d' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        2D Contour
      </button>
      <button
        onClick={() => setVisualizationMode('3d')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationMode === '3d' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        3D Surface
      </button>
    </div>
  </div>

  {visualizationMode === '2d' ? (
    <canvas
      ref={lbfgsParamCanvasRef}
      style={{width: '600px', height: '400px'}}
      className="border border-gray-300 rounded"
    />
  ) : (
    <ObjectiveFunction3D
      objectiveFn={(w) => {
        try {
          const problemFuncs = getCurrentProblemFunctions();
          return problemFuncs.objective(w);
        } catch {
          return 0;
        }
      }}
      bounds={visualizationBounds}
      trajectory={lbfgs3DTrajectory}
      currentIter={lbfgsCurrentIter}
      width={600}
      height={400}
    />
  )}
</div>
```

**Step 5: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 6: Test all algorithms**

```bash
npm run dev
```

Manual test each algorithm:
1. GD Fixed - toggle 2D/3D works, trajectory visible
2. GD Line Search - toggle works, trajectory visible
3. Newton - toggle works, trajectory visible
4. L-BFGS - toggle works, trajectory visible

**Step 7: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(ui): add 3D visualization to all four algorithms"
```

---

## Task 7: Add Camera Reset Button

**Files:**
- Modify: `src/components/ObjectiveFunction3D.tsx`

**Step 1: Add reset camera functionality**

Update ObjectiveFunction3D component to expose camera reset:

```typescript
// Add prop
interface ObjectiveFunction3DProps {
  objectiveFn: (w: number[]) => number;
  bounds: { w0: [number, number]; w1: [number, number] };
  trajectory?: number[][];
  currentIter?: number;
  width?: number;
  height?: number;
  onCameraReset?: () => void; // New prop
}

// Inside component, add ref for OrbitControls
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

function Scene({
  meshData,
  trajectory,
  currentIter,
  currentPoint,
  cameraPosition,
  onResetRef
}: {
  meshData: ReturnType<typeof generateSurfaceMesh>;
  trajectory: number[][];
  currentIter?: number;
  currentPoint: [number, number, number] | null;
  cameraPosition: [number, number, number];
  onResetRef: React.MutableRefObject<(() => void) | null>;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    onResetRef.current = () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    };
  }, [onResetRef]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, 5]} intensity={0.5} />

      <Surface meshData={meshData} />

      {trajectory.length > 0 && (
        <Trajectory points={trajectory} currentIter={currentIter} />
      )}

      {currentPoint && <CurrentPoint position={currentPoint} />}

      <Grid
        args={[20, 20]}
        position={[0, 0, meshData.minZ - 0.1]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#888888"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#444444"
        fadeDistance={50}
        fadeStrength={1}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={20}
      />

      <axesHelper args={[5]} />
    </>
  );
}

export function ObjectiveFunction3D({
  objectiveFn,
  bounds,
  trajectory = [],
  currentIter,
  width = 600,
  height = 500,
}: ObjectiveFunction3DProps) {
  const resetCameraRef = useRef<(() => void) | null>(null);

  // ... existing mesh data and memos ...

  const handleResetCamera = () => {
    if (resetCameraRef.current) {
      resetCameraRef.current();
    }
  };

  return (
    <div style={{ width, height, position: 'relative' }}>
      <Canvas
        camera={{
          position: cameraPosition,
          fov: 50,
        }}
      >
        <Scene
          meshData={meshData}
          trajectory={trajectory}
          currentIter={currentIter}
          currentPoint={currentPoint}
          cameraPosition={cameraPosition}
          onResetRef={resetCameraRef}
        />
      </Canvas>

      <button
        onClick={handleResetCamera}
        className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600"
        title="Reset camera view"
      >
        Reset View
      </button>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 3: Test reset button**

```bash
npm run dev
```

Manual test:
1. Switch to 3D mode
2. Rotate/zoom camera
3. Click "Reset View" button
4. Verify camera returns to original position

**Step 4: Commit**

```bash
git add src/components/ObjectiveFunction3D.tsx
git commit -m "feat(3d): add camera reset button to 3D visualization"
```

---

## Task 8: Optimize Performance for Large Meshes

**Files:**
- Modify: `src/utils/surfaceMeshGenerator.ts`
- Modify: `src/components/ObjectiveFunction3D.tsx`

**Step 1: Add resolution adjustment based on problem bounds**

Update generateSurfaceMesh to use adaptive resolution:

```typescript
export function generateSurfaceMesh(
  objectiveFn: (w: number[]) => number,
  bounds: { w0: [number, number]; w1: [number, number] },
  resolution?: number // Make optional
): SurfaceMeshData {
  // Auto-adjust resolution based on bounds if not specified
  if (resolution === undefined) {
    const w0Range = bounds.w0[1] - bounds.w0[0];
    const w1Range = bounds.w1[1] - bounds.w1[0];
    const avgRange = (w0Range + w1Range) / 2;

    // Lower resolution for larger domains
    if (avgRange > 10) {
      resolution = 30;
    } else if (avgRange > 5) {
      resolution = 40;
    } else {
      resolution = 50;
    }
  }

  // Rest of existing code...
}
```

**Step 2: Add memo to prevent unnecessary re-renders**

In ObjectiveFunction3D, ensure trajectory conversion is memoized:

```typescript
// Already done in previous tasks, but verify:
const trajectory3D = useMemo(() => {
  return trajectory.map(p => p as [number, number, number]);
}, [trajectory]);
```

**Step 3: Test with different problems**

```bash
npm run dev
```

Manual test:
1. Switch to Quadratic (small domain) - should use resolution=50
2. Switch to Rosenbrock (medium domain) - should use resolution=40
3. Verify smooth performance in both cases

**Step 4: Commit**

```bash
git add src/utils/surfaceMeshGenerator.ts src/components/ObjectiveFunction3D.tsx
git commit -m "perf(3d): add adaptive mesh resolution based on domain size"
```

---

## Task 9: Update Documentation

**Files:**
- Modify: `docs/experiments-guide.md`
- Create: `docs/3d-visualization-guide.md`

**Step 1: Create 3D visualization guide**

```markdown
# 3D Visualization Guide

## Overview

The Newton's Method visualizer now supports interactive 3D surface plots of objective functions using Three.js. This provides better intuition for understanding the loss landscape and optimization trajectories.

## Features

### 3D Surface Mesh
- Color-mapped by loss value (blue=low, red=high)
- Interactive camera controls (rotate, zoom, pan)
- Smooth mesh with computed vertex normals

### Trajectory Overlay
- Optimization path shown as magenta line in 3D space
- Animates as you step through iterations
- Current position marked with pulsing green sphere

### Camera Controls
- **Left click + drag**: Rotate view
- **Right click + drag**: Pan view
- **Scroll wheel**: Zoom in/out
- **Reset View button**: Return to default camera position

## Usage

1. Select any algorithm tab (GD Fixed, GD Line Search, Newton, L-BFGS)
2. Click "3D Surface" button above the parameter space
3. Use mouse to interact with the 3D view
4. Step through algorithm iterations to see trajectory animation
5. Switch back to "2D Contour" for traditional heatmap view

## Technical Details

### Mesh Generation
- Adaptive resolution (30-50 grid points) based on domain size
- Efficient BufferGeometry for GPU rendering
- Vertex colors for smooth gradients

### Performance
- Three.js handles rendering on GPU
- Meshes are memoized and only regenerate when problem changes
- Runs smoothly even with 2500+ vertices

### Compatibility
- Requires WebGL-capable browser
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile support with touch gestures

## Troubleshooting

**Problem**: 3D view is blank or black
- **Solution**: Check browser WebGL support at https://get.webgl.org/

**Problem**: Performance is slow
- **Solution**: Close other tabs, ensure hardware acceleration is enabled

**Problem**: Can't see trajectory
- **Solution**: Run algorithm first (click Step button), then switch to 3D

## Comparison with 2D View

| Feature | 2D Contour | 3D Surface |
|---------|------------|------------|
| Loss landscape | Heatmap colors | Mesh height |
| Curvature | Hard to see | Obvious from geometry |
| Camera | Fixed top-down | Fully rotatable |
| Performance | Faster | Slightly slower |
| Best for | Quick overview | Deep understanding |

Both views show the same information - use whichever helps you learn best!
```

**Step 2: Update experiments guide**

Add section to `docs/experiments-guide.md`:

```markdown
## 3D Visualization

Each algorithm now supports 3D surface plots of the objective function. Click the "3D Surface" button above the parameter space to switch views.

**Benefits:**
- See curvature and valleys more clearly
- Understand why algorithms take certain paths
- Visualize Hessian information (how steep the surface is)

**Example experiments that benefit from 3D:**
- **Rosenbrock**: See the famous "banana valley" in 3D
- **Saddle Point**: Observe the saddle shape clearly
- **Ill-Conditioned**: Understand the elongated ellipse geometry

See [3D Visualization Guide](./3d-visualization-guide.md) for details.
```

**Step 3: Commit**

```bash
git add docs/experiments-guide.md docs/3d-visualization-guide.md
git commit -m "docs: add 3D visualization guide and update experiments guide"
```

---

## Task 10: Add Comparison Mode 3D Support

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Purpose:** Support 3D view in side-by-side comparison mode

**Step 1: Add visualization mode to comparison state**

Find comparison mode rendering section (search for "comparisonMode !== 'none'").

Add toggle buttons above ComparisonCanvas:

```typescript
{comparisonMode !== 'none' && (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold text-gray-900">Algorithm Comparison</h2>
      <div className="flex gap-2">
        <button
          onClick={() => setVisualizationMode('2d')}
          className={`px-3 py-1 rounded text-sm ${
            visualizationMode === '2d' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          2D View
        </button>
        <button
          onClick={() => setVisualizationMode('3d')}
          className={`px-3 py-1 rounded text-sm ${
            visualizationMode === '3d' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          3D View
        </button>
        <button
          onClick={() => setComparisonMode('none')}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Exit Comparison
        </button>
      </div>
    </div>

    <ComparisonView
      left={{ /* ... */ }}
      right={{ /* ... */ }}
      onLeftIterChange={setComparisonLeftIter}
      onRightIterChange={setComparisonRightIter}
    />

    {visualizationMode === '2d' ? (
      <ComparisonCanvas
        leftIterations={comparisonLeftIterations}
        leftCurrentIter={comparisonLeftIter}
        leftColor="#3b82f6"
        rightIterations={comparisonRightIterations}
        rightCurrentIter={comparisonRightIter}
        rightColor="#10b981"
        width={1200}
        height={500}
        title="Parameter Space Comparison"
      />
    ) : (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-center font-semibold mb-2 text-blue-700">
            {/* Left algorithm name */}
          </h3>
          <ObjectiveFunction3D
            objectiveFn={(w) => {
              try {
                return getCurrentProblemFunctions().objective(w);
              } catch {
                return 0;
              }
            }}
            bounds={visualizationBounds}
            trajectory={comparisonLeftIterations.map(iter => [
              iter.wNew[0],
              iter.wNew[1],
              iter.loss
            ])}
            currentIter={comparisonLeftIter}
            width={580}
            height={450}
          />
        </div>
        <div>
          <h3 className="text-center font-semibold mb-2 text-green-700">
            {/* Right algorithm name */}
          </h3>
          <ObjectiveFunction3D
            objectiveFn={(w) => {
              try {
                return getCurrentProblemFunctions().objective(w);
              } catch {
                return 0;
              }
            }}
            bounds={visualizationBounds}
            trajectory={comparisonRightIterations.map(iter => [
              iter.wNew[0],
              iter.wNew[1],
              iter.loss
            ])}
            currentIter={comparisonRightIter}
            width={580}
            height={450}
          />
        </div>
      </div>
    )}
  </div>
)}
```

**Step 2: Test comparison mode**

```bash
npm run dev
```

Manual test:
1. Load "Compare: Fixed vs Adaptive" experiment
2. Toggle between 2D and 3D views
3. Verify both algorithms show in 3D side-by-side
4. Step through iterations independently

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(comparison): add 3D visualization support to comparison mode"
```

---

## Testing Checklist

### Functional Tests
- [ ] 2D/3D toggle works for all 4 algorithms
- [ ] 3D surface renders correctly for all 5 problem types
- [ ] Trajectory line appears and updates with iterations
- [ ] Current point marker animates (pulsing green sphere)
- [ ] Camera controls work (rotate, zoom, pan)
- [ ] Reset view button returns camera to default
- [ ] Color mapping shows blue (low loss) to red (high loss)
- [ ] Grid appears at bottom of surface
- [ ] Axes helper visible
- [ ] Comparison mode supports 3D (side-by-side views)

### Problem-Specific Tests
- [ ] Quadratic: Smooth bowl shape, trajectory spirals to center
- [ ] Ill-Conditioned: Elongated ellipse, trajectory follows valley
- [ ] Rosenbrock: Banana valley visible, trajectory navigates curve
- [ ] Saddle Point: Saddle shape clear, trajectory behavior varies
- [ ] Logistic Regression: 3D surface of loss over parameter space

### Performance Tests
- [ ] Mesh generation completes in <500ms
- [ ] Camera interaction is smooth (>30 FPS)
- [ ] Switching between 2D/3D is instant
- [ ] No memory leaks when switching problems repeatedly
- [ ] Works on mobile devices (touch gestures)

### Visual Quality Tests
- [ ] Surface normals computed correctly (smooth shading)
- [ ] Colors transition smoothly (no banding)
- [ ] Trajectory line clearly visible against surface
- [ ] Current point marker stands out
- [ ] Lighting shows surface curvature well

### Edge Cases
- [ ] Works with zero iterations (empty trajectory)
- [ ] Works with single iteration (point but no line)
- [ ] Handles very flat surfaces (near-zero Z range)
- [ ] Handles very steep surfaces (large Z range)
- [ ] Camera doesn't clip through surface

---

## Success Criteria

✅ **All 4 algorithms** have working 3D visualization
✅ **All 5 problem types** render correctly in 3D
✅ **Interactive camera controls** (rotate, zoom, pan, reset)
✅ **Trajectory animation** synced with iteration stepping
✅ **Comparison mode** supports side-by-side 3D views
✅ **Performance** is smooth on modern browsers
✅ **Documentation** explains how to use 3D view
✅ **Build** completes with no errors
✅ **Bundle size** acceptable (Three.js adds ~300KB gzipped)

---

## Bundle Size Impact

Three.js and React Three Fiber will add approximately:
- `three`: ~150KB gzipped
- `@react-three/fiber`: ~50KB gzipped
- `@react-three/drei`: ~100KB gzipped
- **Total**: ~300KB gzipped added to bundle

Current bundle is ~168KB gzipped, so new total will be ~468KB gzipped (still reasonable for a rich visualization app).

---

## Future Enhancements (Out of Scope)

These are NOT part of this plan but could be added later:

- VR/AR support for immersive visualization
- Export 3D view as image or video
- Custom lighting controls
- Wireframe overlay option
- Multiple trajectory comparison in single 3D view
- Contour lines projected on surface
- Hessian eigenvalue visualization (arrows showing curvature directions)
