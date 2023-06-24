export interface IPopulateOption {
    path: string;
    select?: string;
    match?: Record<string, any>;
    options?: {
      sort?: Record<string, 1 | -1>;
      limit?: number;
    };
  }
  