import { NonogramGenerator } from './nonogram/NonogramGenerator';
import { NonogramData } from '../types';

export class NonogramEngine {
  static generate(size: number, seed: number): NonogramData {
    return NonogramGenerator.generate(size, seed);
  }
}
