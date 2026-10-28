import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { GetPendingCoach, GetPendingStore, QueryUserDto } from './dtos/query.user.js';
import { UpdateCoachByAdminDto, UpdateProfileDto, UpdateStoreByAdminDto, UpdateUserDto } from './dtos/update.user.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import pagination from '../../common/utils/pagination.js';
import { hashPassword } from '../../common/utils/hash.util.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { ConfigService } from '@nestjs/config';
import { CreateStoreDto } from '../store/dto/store.dto.js';
import { CreateCoachDto } from '../coach/dto/coach.dto.js';
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) { }

  async getAllUser(query: QueryUserDto) {
    const { search, role, page = 1, order = 'desc', limit, status, isEmailVerified, isPhoneVerified } = query;
    const searchFilter = {} as any;
    const limitPage = Number(limit) || Number(this.configService.get('limit.user'))
    if (search) {
      searchFilter.OR = [
        {
          name: { contains: search.toString(), mode: 'insensitive' }
        },
        {
          phone: { contains: search.toString(), mode: 'insensitive' }
        },
        { email: { contains: search.toString(), mode: 'insensitive' } }
      ];
    }
    if (status && status !== 'ALL') searchFilter.status = status
    if (isEmailVerified || isEmailVerified === false) searchFilter.isEmailVerified = isEmailVerified;
    if (isPhoneVerified || isPhoneVerified === false) searchFilter.isPhoneVerified = isPhoneVerified;
    if (role && role !== "ALL") searchFilter.role = role;
    const [data, count] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: searchFilter,
        select: {
          role: true,
          email: true,
          name: true,
          id: true,
          createdAt: true,
          status: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          phone: true,
        },
        orderBy: { createdAt: order || 'desc' },
        skip: (Number(page) - 1) * Number(limitPage),
        take: Number(limitPage),
      }),
      this.prisma.user.count({ where: searchFilter }),
    ]);
    return { data, pagination: pagination(count, Number(page), Number(limitPage)) };
  }

  async updateUserAdmin(body: UpdateUserDto, id: string) {
    await this.prisma.user.update({
      where: {
        id: id
      },
      data: {
        email: body.email ?? undefined,
        name: body.name ?? undefined,
        password: body.password ? await hashPassword(body.password) : undefined,
        role: body.role ?? undefined,
        phone: body.phone ?? undefined,
        status: body.status ?? undefined,
      }
    })
    return { success: true }
  }

  async updateUser(body: UpdateUserDto, id: string) {
    const data = await this.prisma.user.update({
      where: {
        id,
        status: { not: 'DELETED' }
      },
      data: {
        email: body.email ?? undefined,
        name: body.name ?? undefined,
        password: body.password ? await hashPassword(body.password) : undefined,
        phone: body.phone ?? undefined
      }
    })
    if (!data) {
      throw new NotFoundException('کاربر یافت نشد')
    }
    return { success: true }
  }

  async deleteUser(id: string) {
    const data = await this.prisma.user.update({
      where: { id },
      data: { status: 'DELETED' },
      select: {
        coach: {
          select: { id: true }
        },
        store: {
          select: { id: true }
        }
      }
    })
    if (data.coach?.id) {
      await this.prisma.coach.update({
        where: { id: data.coach?.id },
        data: { status: 'REJECTED' },
      })
    }
    if (data.store?.id) {
      await this.prisma.store.update({
        where: { id: data.store?.id },
        data: { status: 'REJECTED' },
      })
    }
    return { success: true }
  }

  async createUser(body: UpdateUserDto) {
    if (!body.name || !body.email || !body.password) {
      throw new BadRequestException('تمام فیلدهای لازم را پر کنید')
    }
    try {
      await this.prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: await hashPassword(body.password),
          role: body.role,
          phone: body.phone
        },
      });
      return { success: true }
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('ایمیل یا شماره تکراری است')
      throw e
    }

  }

  async getProfile(id?: string) {
    if (!id) throw new UnauthorizedException('دوباره وارد حساب کاربری شوید')
    const profile = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        profile: {
          include: {
            trainingGoal: {
              select: {
                id: true,
                title: true,
                logo: true
              }
            }
          }
        }
      }
    })
    return profile
  }

  async getProfileByAdmin(id: string) {
    const profile = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        profile: {
          include: {
            trainingGoal: {
              select: {
                id: true,
                title: true,
                logo: true
              }
            }
          }
        }
      }
    })
    if (!profile) throw new NotFoundException('کاربر یافت نشد')
    return profile
  }

  async updateOrCreateProfile(body: UpdateProfileDto, id: string) {
    const data = await this.prisma.user.findUnique({ where: { id }, select: { profile: { select: { id: true } } } })
    if (!data?.profile?.id) {
      await this.prisma.profile.create({
        data: {
          ...body,
          userId: id,
        }
      })
      return { success: true }
    } else {
      await this.prisma.profile.update({
        where: { id: data?.profile?.id },
        data: body
      })
      return { success: true }
    }
  }

  // store //
  async updateStoreStatus(body: UpdateStoreByAdminDto, id: string) {
    console.log(id);
    
    const { status } = body
    const userData = await this.prisma.store.findUnique({
      where: { id }, select: {
        owner: {
          select: { status: true, id: true }
        }
      }
    })

    if (userData?.owner.status === 'DELETED') {
      throw new ConflictException('کاربر حذف شده مجاز به تغییر اطلاعات نیست')
    }

    if (status === 'APPROVED') {
      await this.prisma.store.update({
        where: { id },
        data: {
          ...body,
          isActive: true,
          isVerified: true
        }
        , select: {
          userId: true
        }
      })
      await this.prisma.user.update({
        where: { id: userData?.owner.id },
        data: {
          role: 'STORE'
        }
      })
      return { success: true }
    } else {
      await this.prisma.store.update({
        where: { id },
        data: body
      })
      return { success: true }
    }
  }

  async requestAddStore(body: CreateStoreDto, id: string) {
    await this.prisma.store.create({
      data: {
        ...body, userId: id, rating: {
          create: {},
        }
      }
    })
    return { success: true }
  }

  async getPendingStore(qury: GetPendingStore) {
    const { page = 1, limit, order, status } = qury
    const limitPage = Number(limit) || Number(this.configService.get('limit.user'))
    const where = {
      ...(status && status !== 'ALL' && { status })
    }
    const [data, count] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where: where,
        orderBy: { createdAt: order || 'desc' },
        skip: (Number(page) - 1) * Number(limitPage),
        take: Number(limitPage),
      }),
      this.prisma.store.count({ where }),
    ]);
    return { store: data, pagination: pagination(count, page, limitPage) }
  }

  // coach //
  async updateCoachStatus(body: UpdateCoachByAdminDto, id: string) {
    const { rejectionReason, status } = body
    const userData = await this.prisma.coach.findUnique({
      where: { id }, select: {
        user: {
          select: { status: true, id: true }
        }
      }
    })
    if (userData?.user.status === 'DELETED') {
      throw new ConflictException('کاربر حذف شده مجاز به تغییر اطلاعات نیست')
    }
    if (status === 'APPROVED') {
      await this.prisma.coach.update({
        where: { id },
        data: {
          status: status,
          rejectionReason: rejectionReason
        }
      })
      await this.prisma.user.update({
        where: { id: userData?.user.id },
        data: {
          role: 'COACH'
        }
      })
      return { success: true }
    } else {
      await this.prisma.coach.update({
        where: { id },
        data: {
          status: status,
          rejectionReason: rejectionReason
        }
      })
      return { success: true }
    }
  }

  async requestAddCoach(body: CreateCoachDto, id: string) {
    await this.prisma.coach.create({ data: { ...body, userId: id } })
    return { success: true }
  }

  async getPendingCoach(qury: GetPendingCoach) {
    const { page = 1, limit, order, status } = qury
    const limitPage = Number(limit) || Number(this.configService.get('limit.user'))
    const where = {
      ...(status && status !== 'ALL' && { status })
    }
    const [data, count] = await this.prisma.$transaction([
      this.prisma.coach.findMany({
        where: where,
        orderBy: { createdAt: order || 'desc' },
        skip: (Number(page) - 1) * Number(limitPage),
        take: Number(limitPage),
      }),
      this.prisma.coach.count({ where }),
    ]);
    return { coach: data, pagination: pagination(count, page, limitPage) }
  }
}