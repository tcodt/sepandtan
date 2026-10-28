import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCityDto, CreateProvinceDto, GetCityByProvinceId, UpdateCityDto } from './dtos/create.province.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
@Injectable()
export class ProvinceService {
  constructor(private readonly prisma: PrismaService) { }

  async getAllProvince() {
    const data = await this.prisma.province.findMany({ orderBy: { name: 'asc' }, select: { name: true, id: true } })
    return data
  }

  async updateProvince(body: CreateProvinceDto, id: string) {
    const data = await this.prisma.province.update({
      where: {
        id
      },
      data: body
    })
    if (!data) {
      throw new NotFoundException('استان یافت نشد')
    }
    return { success: true }
  }

  async deleteProvince(id: string) {
    await this.prisma.province.delete({
      where: {
        id
      }
    })
    return { success: true }
  }

  async createProvince(body: CreateProvinceDto) {
    const exists = await this.prisma.province.findFirst({
      where: { name: body.name, },
    });
    if (exists) {
      throw new ConflictException('این استان قبلاً ثبت شده است');
    }
    await this.prisma.province.create({ data: body });
    return { success: true }
  }

  async getAllCity(query: GetCityByProvinceId) {
    const { provinceId } = query
    const where: any = {
      ...(provinceId && { provinceId })
    };
    const data = await this.prisma.city.findMany({
      where
      ,
      orderBy: { name: 'asc' },
      select: {
        name: true, id: true, provinceId: true,
        province: !provinceId ? {
          select: {
            name: true, id: true
          }
        } : false
      }
    })
    return data
  }

  async updateCity(body: UpdateCityDto, id: string) {
    const data = await this.prisma.city.update({
      where: {
        id
      },
      data: body
    })
    if (!data) {
      throw new NotFoundException('شهر یافت نشد !')
    }
    return { success: true }
  }

  async deleteCity(id: string) {
    await this.prisma.city.delete({
      where: {
        id
      }
    })
    return { success: true }
  }

  async createCity(body: CreateCityDto) {
    const exists = await this.prisma.city.findFirst({
      where: {
        provinceId: body.provinceId,
        name: body.name,
      },
    });

    if (exists) {
      throw new ConflictException('این شهر در این استان قبلاً ثبت شده است');
    }

    await this.prisma.city.create({ data: body });
    return { success: true };
  }
}
