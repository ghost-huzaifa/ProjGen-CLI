import { Controller, Get, Post, Body, Patch, Param, Delete, Query, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiResponse, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { AddUserPermissionsDto } from './dto/add-user-permissions.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { GetUser } from '@common/decorators/get-user.decorator';
import { PaginatedResponseDto, PaginationQueryDto } from '@common/dto/pagination.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ type: UserResponseDto })
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'NURSE')
  @RequirePermissions('USER_READ')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    description: 'Returns paginated users data',
    type: PaginatedResponseDto,
  })
  findAll(
    @GetUser() user: UserResponseDto,
    @Query() paginationOptions: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findAll(paginationOptions);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'NURSE', 'PATIENT', 'DOCTOR')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ type: UserResponseDto })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOneById(id);
    if (user) return user;
    else throw new NotFoundException('User not found');
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ type: UserResponseDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ description: 'The user has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/permissions')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({
    summary: 'Add permissions to user',
    description: 'Adds specified permissions to a user',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: AddUserPermissionsDto })
  async addPermissions(@Param('id') id: string, @Body() addUserPermissionsDto: AddUserPermissionsDto) {
    return this.usersService.addPermissions(id, addUserPermissionsDto.permissionIds);
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get all admin users' })
  @ApiResponse({ status: 200, description: 'List of admin users' })
  findAdmins() {
    return this.usersService.findAdmins();
  }
}
