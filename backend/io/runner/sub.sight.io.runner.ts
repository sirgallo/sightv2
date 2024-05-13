import { TensorData } from '../../core/data/types/TensorDb.js';

import { TensorIO, tensorIORunner } from '../tensor.io.js';
import { TENSOR_IO_RUNNER_RESULTS_REGISTRY } from '../tensor.io.types.js';
import { generateRandomTensorData } from '../data/tensor.io.data.js';
import { SightIO, sightIORunner } from '../sight.io.runner.js';


class SubIORunner extends SightIO<TENSOR_IO_RUNNER_RESULTS_REGISTRY['db']> {
  constructor() { super() }

  async runIO(): Promise<TENSOR_IO_RUNNER_RESULTS_REGISTRY['db']> {
    const tensors = await this.setMockData();
    await this.getMockData(tensors);
    await this.getMockDataLua(tensors);
    
    return true;
  }

  private publishMockData() {

  }
}


sightIORunner({ 
  ioRunner: new SubIORunner()
});