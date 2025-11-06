// src/components/ObjectiveFunction3D.tsx

import { useRef, useMemo } from 'react';
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

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({ color: '#ff00ff', linewidth: 2 });
  }, []);

  return (
    <primitive object={new THREE.Line(geometry, material)} />
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
