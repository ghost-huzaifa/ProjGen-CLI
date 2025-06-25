import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiProperty({
    description: 'Page Number to return',
    required: false,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number = 0;

  @ApiProperty({
    description: 'Number of records to return per page',
    required: false,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  per_page?: number = 10;

  @ApiPropertyOptional({ description: 'Search string to filter records', example: 'search text' })
  @IsOptional()
  @IsString()
  searchString?: string;

  @ApiPropertyOptional({ 
    description: 'Field to sort by', 
    example: 'createdAt',
    required: false
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order (asc or desc)', 
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ 
    description: 'Filters to apply as JSON string', 
    example: '{"dayOfWeek":["MONDAY","TUESDAY"],"isAvailable":[true]}',
    required: false
  })
  @IsOptional()
  @IsString()
  filters?: string;
}

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total number of records',
    type: Number,
  })
  total: number;

  @ApiProperty({
    description: 'Number of records returned',
    type: Number,
  })
  count: number;

  @ApiProperty({
    description: 'Number of records to return per page',
    type: Number,
  })
  per_page: number;

  @ApiProperty({
    description: 'Current page',
    type: Number,
  })
  page: number;

  @ApiProperty({
    description: 'Total number of pages',
    type: Number,
  })
  pages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'List of records',
    isArray: true,
  })
  records: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  constructor(records: T[], total: number, options: PaginationQueryDto) {
    const { per_page, page } = options;
    this.records = records;
    this.meta = {
      total,
      count: records.length,
      per_page: per_page ?? 10,
      page: page ?? 1,
      pages: Math.ceil(total / (per_page ?? 10)),
    };
  }
}
