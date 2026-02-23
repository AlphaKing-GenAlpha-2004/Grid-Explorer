import { SolverResult } from './AStarSolver';

export class DFSSolver {
  static solveMaze(grid: number[][], start: { r: number; c: number }, end: { r: number; c: number }): SolverResult {
    const startTime = performance.now();
    const size = grid.length;
    const stack: { r: number; c: number; path: { r: number; c: number }[] }[] = [{ ...start, path: [start] }];
    const visited = new Set<string>();
    
    let iterations = 0;
    let nodesExpanded = 0;
    const visitedNodes: { r: number; c: number }[] = [];

    while (stack.length > 0) {
      iterations++;
      const current = stack.pop()!;
      nodesExpanded++;
      visitedNodes.push({ r: current.r, c: current.c });
      
      if (current.r === end.r && current.c === end.c) {
        return {
          solution: current.path,
          visited: visitedNodes,
          frontier: stack.map(s => ({ r: s.r, c: s.c })),
          stats: { timeMs: performance.now() - startTime, steps: current.path.length, iterations, depth: current.path.length, nodesExpanded, pathLength: current.path.length }
        };
      }
      
      const key = `${current.r},${current.c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      
      const neighbors = [
        { r: current.r + 1, c: current.c },
        { r: current.r - 1, c: current.c },
        { r: current.r, c: current.c + 1 },
        { r: current.r, c: current.c - 1 }
      ].filter(n => n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && grid[n.r][n.c] === 0 && !visited.has(`${n.r},${n.c}`));
      
      for (const neighbor of neighbors) {
        stack.push({ ...neighbor, path: [...current.path, neighbor] });
      }
    }
    
    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  static solveSliding(grid: number[][]): SolverResult {
    const startTime = performance.now();
    const size = grid.length;
    const target = this.getTarget(size);
    const targetStr = JSON.stringify(target);
    
    const stack: { grid: number[][]; empty: { r: number; c: number }; path: any[]; depth: number }[] = [
      { grid, empty: this.findEmpty(grid), path: [grid], depth: 0 }
    ];
    const visited = new Set<string>();
    
    let iterations = 0;
    let nodesExpanded = 0;
    while (stack.length > 0) {
      iterations++;
      if (iterations > 10000) break;
      
      const current = stack.pop()!;
      nodesExpanded++;
      const currentStr = JSON.stringify(current.grid);
      
      if (currentStr === targetStr) {
        return {
          solution: current.path,
          stats: { timeMs: performance.now() - startTime, steps: current.path.length - 1, iterations, depth: current.depth, nodesExpanded }
        };
      }
      
      if (visited.has(currentStr) || current.depth > 20) continue;
      visited.add(currentStr);
      
      const { r, c } = current.empty;
      const moves = [
        { r: r + 1, c }, { r: r - 1, c }, { r, c: c + 1 }, { r, c: c - 1 }
      ].filter(m => m.r >= 0 && m.r < size && m.c >= 0 && m.c < size);
      
      for (const move of moves) {
        const nextGrid = current.grid.map(row => [...row]);
        nextGrid[r][c] = nextGrid[move.r][move.c];
        nextGrid[move.r][move.c] = 0;
        stack.push({ grid: nextGrid, empty: move, path: [...current.path, nextGrid], depth: current.depth + 1 });
      }
    }
    
    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  private static findEmpty(grid: number[][]) {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 0) return { r, c };
      }
    }
    return { r: 0, c: 0 };
  }

  private static getTarget(size: number): number[][] {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    for (let i = 0; i < size * size - 1; i++) {
      grid[Math.floor(i / size)][i % size] = i + 1;
    }
    return grid;
  }
}
