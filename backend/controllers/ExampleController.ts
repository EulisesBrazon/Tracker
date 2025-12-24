import { ExampleService } from '../services/ExampleService';

export const ExampleController = {
  async handleGet() {
    const data = await ExampleService.getData();
    return data;
  },
};
