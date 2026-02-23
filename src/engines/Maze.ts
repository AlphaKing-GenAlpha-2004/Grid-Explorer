import { MazeGenerator } from './maze/MazeGenerator';
import { MazeGenAlgorithm, MazeData } from '../types';

export class MazeEngine {
  static generate(size: number, seed: number, algorithm: MazeGenAlgorithm = 'dfs'): MazeData {
    return MazeGenerator.generate(size, seed, algorithm);
  }
}
