import { ExampleData } from '../models/ExampleModel';

export const ExampleService = {
  async getData(): Promise<ExampleData> {
    return {
      message: 'Backend service OK',
      time: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV ?? null,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? null,
        DATABASE_URL: process.env.DATABASE_URL ?? null,
      },
    };
  },
};
