/**
 * AddressesService - سرویس مدیریت آدرس‌های کاربران
 */
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, dto: CreateAddressDto) {
    const counter = await this.prisma.address.count({ where: { userId } })
    if (Number(counter) >= 10) {
      throw new ConflictException('مجاز به ساخت 10 آدرس بیشتر نیستید لطفا یکی از آدرس های خود را حذف کنید')
    }
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    const newAddress = await this.prisma.address.create({
      data: {
        ...dto,
        userId,
      },
    });
    return newAddress;
  }

  async getUserAddresses(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      select: {
        province: { select: { name: true, } },
        title: true,
        isDefault: true,
        fullName: true,
        phone: true,
        id:true
      },
      orderBy: { createdAt: 'desc' },
    });
    return addresses;
  }

  async findOne(addressId: string, userId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('آدرس یافت نشد');
    return address;
  }

  async update(addressId: string, userId: string, dto: UpdateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: addressId }, isDefault: true },
        data: { isDefault: false },
      });
    }
    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
    return updated;
  }

  async delete(addressId: string, userId: string) {
    const address = await this.findOne(addressId, userId);

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { success: true };
  }

  async setDefault(addressId: string, userId: string) {
    await this.findOne(addressId, userId);
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
    return updated;
  }

  async getDefaultAddress(userId: string) {
    const address = await this.prisma.address.findFirst({
      where: { userId, isDefault: true },
      include: {
        province: { select: { name: true, id: true } },
        city: { select: { name: true, id: true } }
      }
    });
    return address;
  }
}