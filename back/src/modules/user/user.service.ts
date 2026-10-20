import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { QueryUserDto } from './dtos/query.user.js';
import { UpdateUserDto } from './dtos/update.user.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import pagination from '../../common/utils/pagination.js';
import { hashPassword } from '../../common/utils/hash.util.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  async getAllUser(query: QueryUserDto) {
    const { search, role, page = 1, order = 'desc', limit = 10 } = query;
    const searchFilter = {} as any;
    if (search) {
      searchFilter.OR = [
        {
          name: { contains: search.toString(), mode: 'insensitive' }
        },
        {
          phone: { contains: search.toString(), mode: 'insensitive' }
        },
      ];
    }
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
          phone: true,
        },
        orderBy: { createdAt: order || 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      this.prisma.user.count({ where: searchFilter }),
    ]);
    const paginations = pagination(count, Number(page), Number(limit));
    return { data, ...paginations };
  }

  async updateUser(body: UpdateUserDto, req: Request) {
    if ((body?.id || body.role) && req.user?.role !== "ADMIN") {
      throw new ForbiddenException('مجوز لازم را ندارید')
    }
    const data = await this.prisma.user.update({
      where: {
        id: body?.id ? body.id : req.user?.id
      },
      data: {
        email: body.email || undefined,
        name: body.name || undefined,
        password: body.password ? await hashPassword(body.password) : undefined,
        role: body.role || undefined,
        phone: body.phone || undefined,
      }
    })
    if (!data) {
      throw new NotFoundException('کاربر یافت نشد')
    }
    return { success: true }
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({
      where: {
        id
      }
    })
    return { success: true }
  }

  async createUser(body: UpdateUserDto) {
    if (!body.name || !body.email || !body.password) {
      throw new BadRequestException('تمام فیلدهای لازم را پر کنید')
    }
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
  }

  async getProfile(req: Request, id?: string, rolesd?: string) {
    console.log(rolesd);
    const role = req.user?.role === "ADMIN"
    console.log(role,'kir');
    if (id && role) {
      const profile = await this.prisma.user.findUnique({
        where: { id: id || req.user?.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        }
      })
      return profile
    } else {
      if (!req.user?.id) throw new UnauthorizedException('دوباره وارد حساب کاربری شوید')
      const profile = await this.prisma.user.findUnique({
        where: { id: req.user?.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        }
      })
      return profile
    }
  }

  async getUsersWithoutContractorProfile(query: QueryDefaultDto) {
    const { page = 1, limit = 10 } = query;
    const [data, count] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          role: 'CONTRACTOR',
          contractors: {
            is: null
          }
        },
        select: {
          name: true,
          id: true,
          phone: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      this.prisma.user.count({
        where: {
          role: 'CONTRACTOR',
          contractors: {
            is: null
          }
        }
      }),
    ]);
    const paginations = pagination(count, Number(page), Number(limit));
    return { data, ...paginations };
  }

}
