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
