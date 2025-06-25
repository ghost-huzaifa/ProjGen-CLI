import { PaginatedResponseDto, PaginationQueryDto } from '../dto/pagination.dto';
import { PrismaService } from '../prisma.service';

export async function paginate<T, R>({
  prisma,
  model,
  options,
  where = {},
  include = undefined,
  select = undefined,
  orderBy = { createdAt: 'desc' as const },
  mapper = (item) => item as unknown as R,
}: {
  prisma: PrismaService;
  model: string;
  options: PaginationQueryDto;
  where?: any;
  include?: any;
  orderBy?: any;
  select?: any;
  mapper?: (item: T) => R;
}): Promise<PaginatedResponseDto<R>> {
  const per_page = options.per_page || 10;
  const page = options.page || 1;

  // Create base where condition without search
  const baseWhere = { ...where };
  delete baseWhere.OR; // Remove any OR conditions that might include search

  // Get total count using base where condition
  const total = await prisma[model].count({ where: baseWhere });

  if (options.sort) {
    if (options.sort.includes('.')) {
      const parts = options.sort.split('.');
      if (parts.length === 2) {
        // Handle one level of nesting
        const [relation, field] = parts;
        orderBy = {
          [relation]: {
            [field]: options.order || 'asc'
          }
        };
      }
    } else {
      // Non-nested field sorting
      orderBy = {
        [options.sort]: options.order || 'asc'
      };
    }
  }

  // Build query params - can't use both include and select
  const queryParams: any = {
    where,
    orderBy,
    take: per_page,
    skip: per_page * (page - 1),
  };

  // Add either include or select, but not both
  if (select) {
    queryParams.select = select;
  } else if (include) {
    queryParams.include = include;
  }

  // Get paginated data
  const items = await prisma[model].findMany(queryParams);

  // Map data if mapper function is provided
  const mappedItems = items.map(mapper);

  // Return paginated response
  return new PaginatedResponseDto<R>(mappedItems, total, { per_page, page });
}
