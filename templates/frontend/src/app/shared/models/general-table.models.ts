export interface TableConfig {
  title: string;
  columns: TableColumn[];
  pageSize?: number;
  pageSizeOptions?: number[];
  showPagination?: boolean;
  selectionEnabled?: boolean;
  serialEnabled?: boolean;
  showFilter?: boolean;
  showColumnFilter?: boolean;
  key?: string;
  defaultSort?: { column: string; direction: 'asc' | 'desc' };
  enableRefresh?: boolean;
  enableSearch?: boolean;
  noDataMessage?: string;
}

export interface TableColumn {
  name: string;
  header: string;
  cell?: (element: any) => string;
  component?: any; // Type for the dynamic component to be rendered
  componentInputs?: (row: any) => Record<string, any>; // Function to provide inputs to the component
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  sticky?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  cellClass?: string | ((row: any) => string);
}

export interface TableAction {
  type: string;
  payload?: any;
}

export interface TableEvent {
  type: string;
  data?: any;
}

export interface TableState {
  pageIndex: number;
  pageSize: number;
  sort: {
    active: string;
    direction: 'asc' | 'desc' | '';
  };
  filter: Record<string, any>;
  search: string;
}