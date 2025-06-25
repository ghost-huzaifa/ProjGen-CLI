import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddUserPermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to add to the user',
    example: ['permission-id-1', 'permission-id-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissionIds: string[];
}
