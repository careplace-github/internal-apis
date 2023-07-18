interface IPopulateOption {
  path: string;
  select?: string;
  match?: Record<string, any>;
  options?: {
    sort?: Record<string, 1 | -1>;
    limit?: number;
  };
}

interface IQueryListResponse<T> {
  data: T[];
  page: number;
  documentsPerPage: number;
  totalPages: number;
  totalDocuments: number;
}

export { IPopulateOption, IQueryListResponse };
