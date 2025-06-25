import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs'; // Changed import syntax
import { PaginatedResponseDto, PaginationQueryDto } from '@common/dto/pagination.dto';
import { paginate } from '@common/helpers/pagination.helper';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = await this.prisma.user.create({
      data: {
        ...createUserDto,
        isActive: true,
        password: hashedPassword,
        fullName: `${createUserDto.firstName} ${createUserDto.lastName}`,
      },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phoneNumber: true,
        dateOfBirth: true,
        gender: true,
        preferredPronouns: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        address: true,
        zip: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        permissions: {
          include: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    Object.keys(createdUser).forEach((key) => {
      if (createdUser[key] === null) {
        createdUser[key] = undefined;
      }
    });
    return {
      ...createdUser,
      preferredPronouns: createdUser.preferredPronouns ?? undefined,
      address: createdUser.address ?? undefined,
      zip: createdUser.zip ?? undefined,
      isActive: createdUser.isActive ?? undefined,
      isEmailVerified: createdUser.isEmailVerified ?? undefined,
      roles: createdUser.roles.map((role) => role.role.name),
      permissions: createdUser.permissions?.map((p) => p.permission.name) || [],
    };
  }

  async findAll(options?: PaginationQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const pageOptions = options || ({} as PaginationQueryDto);
    // Create base where condition
    let where: any = {};

    // Apply search filter
    if (pageOptions.searchString) {
      const s = pageOptions.searchString;
      where = {
        OR: [{ email: { contains: s } }, { firstName: { contains: s } }, { lastName: { contains: s } }],
      };
    }

    return paginate<any, UserResponseDto>({
      prisma: this.prisma,
      model: 'user',
      options: pageOptions,
      where,
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phoneNumber: true,
        dateOfBirth: true,
        gender: true,
        preferredPronouns: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        address: true,
        zip: true,
        cityId: true,
        stateId: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        password: false,
        roles: {
          include: {
            role: {
              select: { name: true },
            },
          },
        },
        permissions: {
          include: {
            permission: {
              select: { name: true },
            },
          },
        },
      },
      mapper: (user) => {
        Object.keys(user).forEach((key) => {
          if (user[key] === null) {
            user[key] = undefined;
          }
        });
        return {
          ...user,
          preferredPronouns: user.preferredPronouns ?? undefined,
          address: user.address ?? undefined,
          zip: user.zip ?? undefined,
          cityId: user.cityId ?? undefined,
          stateId: user.stateId ?? undefined,
          isActive: user.isActive ?? undefined,
          isEmailVerified: user.isEmailVerified ?? undefined,
          roles: user.roles.map((role) => role.role.name),
          permissions: user.permissions?.map((p) => p.permission.name) || [],
        };
      },
    });
  }

  async findOneById(userId: string): Promise<UserResponseDto | null> {
    return this.findUserBy({ userId }, `User with ID ${userId} not found`);
  }

  async findOneByEmail(email: string): Promise<UserResponseDto | null> {
    return this.findUserBy({ email }, `User with Email ${email} not found`);
  }

  async findOneByPhoneNumber(phoneNumber: string): Promise<UserResponseDto | null> {
    return this.findUserBy({ phoneNumber }, `User with phone number ${phoneNumber} not found`);
  }

  private async findUserBy(
    where: { userId?: string; email?: string; phoneNumber?: string }, // Add phoneNumber here
    errorMessage: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(where.userId ? [{ userId: where.userId }] : []),
          ...(where.email ? [{ email: where.email }] : []),
          ...(where.phoneNumber ? [{ phoneNumber: where.phoneNumber }] : []), // Add phoneNumber condition
        ],
      },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phoneNumber: true,
        dateOfBirth: true,
        gender: true,
        preferredPronouns: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        address: true,
        zip: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        password: false,
        roles: {
          include: {
            role: {
              select: { name: true },
            },
          },
        },
        permissions: {
          include: {
            permission: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    Object.keys(user).forEach((key) => {
      if (user[key] === null) {
        user[key] = undefined;
      }
    });
    return {
      ...user,
      preferredPronouns: user.preferredPronouns ?? undefined,
      address: user.address ?? undefined,
      zip: user.zip ?? undefined,
      isActive: user.isActive ?? undefined,
      isEmailVerified: user.isEmailVerified ?? undefined,
      roles: user.roles.map((role) => role.role.name),
      permissions: user.permissions?.map((p) => p.permission.name) || [],
    };
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const data: any = { ...updateUserDto };

    data.password = user.password;

    // Update fullName if firstName or lastName changes
    if (updateUserDto.firstName || updateUserDto.lastName) {
      const newFirstName = updateUserDto.firstName || user.firstName;
      const newLastName = updateUserDto.lastName || user.lastName;
      data.fullName = `${newFirstName} ${newLastName}`;
    }

    const updatedUser = await this.prisma.user.update({
      where: { userId },
      data,
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phoneNumber: true,
        dateOfBirth: true,
        gender: true,
        preferredPronouns: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        address: true,
        zip: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        password: false,
        roles: {
          include: {
            role: {
              select: { name: true },
            },
          },
        },
        permissions: {
          include: {
            permission: {
              select: { name: true },
            },
          },
        },
      },
    });

    Object.keys(updatedUser).forEach((key) => {
      if (updatedUser[key] === null) {
        updatedUser[key] = undefined;
      }
    });
    return {
      ...updatedUser,
      preferredPronouns: updatedUser.preferredPronouns ?? undefined,
      address: updatedUser.address ?? undefined,
      zip: updatedUser.zip ?? undefined,
      isActive: updatedUser.isActive ?? undefined,
      isEmailVerified: updatedUser.isEmailVerified ?? undefined,
      roles: updatedUser.roles.map((role) => role.role.name),
      permissions: updatedUser.permissions?.map((p) => p.permission.name) || [],
    };
  }

  async remove(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.user.delete({
      where: { userId },
    });
  }

  async addPermissions(userId: string, permissionIds: string[]): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Create user-permission relationships
    await Promise.all(
      permissionIds.map((permissionId) =>
        this.prisma.userPermission
          .create({
            data: {
              userId,
              permissionId,
            },
          })
          .catch((error) => {
            // If the relation already exists, ignore the error
            if (error.code === 'P2002') {
              // Unique constraint violation
              return null;
            }
            throw error;
          }),
      ),
    );

    // Get updated user data with roles and permissions
    const newUser = await this.findUserBy({ userId: userId }, `User with ID ${userId} not found`);
    if (newUser) {
      return newUser;
    }
    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  async findAdmins() {
    return this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'admin',
            },
          },
        },
      },
    });
  }
}
