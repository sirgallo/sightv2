import { TensorData } from '../../core/data/types/TensorDb.js';

import { TensorIO, tensorIORunner } from '../tensor.io.js';
import { TENSOR_IO_RUNNER_RESULTS_REGISTRY } from '../tensor.io.types.js';
import { generateRandomTensorData } from '../data/tensor.io.data.js';


class DBIORunner extends TensorIO<TENSOR_IO_RUNNER_RESULTS_REGISTRY['db']> {
  constructor() { super() }

  async runIO(): Promise<TENSOR_IO_RUNNER_RESULTS_REGISTRY['db']> {
    const tensors = await this.setMockData();
    await this.getMockData(tensors);
    await this.getMockDataLua(tensors);
    
    return true;
  }

  private async setMockData() {
    try {
      const tensors = generateRandomTensorData(10, [10, 10])
      await this.tensorDb.exec<'AI.TENSORSET'>({ tensors, tensorType: 'FLOAT' });
      console.log('mock data successfully inserted -->', tensors);
      return tensors;
    } catch (err) {
      console.error('Failed to insert mock tensors:', err);
      throw err;
    }
  }

  private async getMockData(tensors: TensorData[]) {
    try {
      const res = await this.tensorDb.exec<'AI.TENSORGET'>({ keys: tensors.map(t => t.k) });
      console.log('results from get mock tensors -->', res);
      return tensors;
    } catch (err) {
      console.error('Failed to get mock tensors:', err);
      throw err;
    }
  }

  private async getMockDataLua(tensors: TensorData[]) {
    try {
      const res = await this.tensorDb.exec<'AI.TENSORGET'>({ keys: tensors.map(t => t.k), preprocess: true });
      console.log('results from get mock tensors using lua -->', res);
      return tensors;
    } catch (err) {
      console.error('Failed to get mock tensors:', err);
      throw err;
    }
  }
}


sightIORunner({ 
  ioRunner: new DBIORunner()
});