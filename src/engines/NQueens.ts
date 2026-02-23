import { RNG } from '../utils/rng';

export class NQueensEngine {
  static generate(size: number, seed: number): number[] {
    const rng = new RNG(seed);
    // N-Queens "puzzle" is usually finding the solution.
    // We'll return an empty board (represented as an array of -1)
    return Array(size).fill(-1);
  }
}
