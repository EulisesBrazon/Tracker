export interface ExampleData {
  message: string;
  time: string;
  env: {
    NODE_ENV?: string | null;
    NEXT_PUBLIC_API_URL?: string | null;
    DATABASE_URL?: string | null;
  };
}
