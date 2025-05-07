// apps/api/src/app/shifts/services/shift-types.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftTypeDto } from '../dto/create-shift-type.dto';
import { UpdateShiftTypeDto } from '../dto/update-shift-type.dto';
import { FindShiftTypeDto } from '../dto/find-shift-type.dto';
import { ShiftType } from '@prisma/client';

@Injectable()
export class ShiftTypesService {
  constructor(private prisma: PrismaService) {}

  create(createShiftTypeDto: CreateShiftTypeDto): Promise<ShiftType> {
    return this.prisma.shiftType.create({
      data: createShiftTypeDto,
    });
  }

  findAll(query: FindShiftTypeDto): Promise<ShiftType[]> {
    const { skip, take, ...filters } = query;

    return this.prisma.shiftType.findMany({
      where: filters,
      skip: skip,
      take: take,
    });
  }

  async findOne(id: string): Promise<ShiftType> {
    const shiftType = await this.prisma.shiftType.findUnique({
      where: { id },
    });

    if (!shiftType) {
      throw new NotFoundException(`Shift type with ID ${id} not found`);
    }

    return shiftType;
  }

  async update(
    id: string,
    updateShiftTypeDto: UpdateShiftTypeDto
  ): Promise<ShiftType> {
    await this.findOne(id);

    return this.prisma.shiftType.update({
      where: { id },
      data: updateShiftTypeDto,
    });
  }

  async remove(id: string): Promise<ShiftType> {
    await this.findOne(id);

    return this.prisma.shiftType.delete({
      where: { id },
    });
  }

  async cloneShiftType(
    id: string,
    updateData: Partial<UpdateShiftTypeDto>
  ): Promise<ShiftType> {
    const shiftType = await this.findOne(id);

    // Create a new shift type based on the existing one
    const { id: _, createdAt, updatedAt, ...shiftTypeData } = shiftType;

    return this.prisma.shiftType.create({
      data: {
        ...shiftTypeData,
        ...updateData,
        name: updateData.name || `${shiftTypeData.name} (Clone)`,
      },
    });
  }

  findByOrganization(organizationId: string): Promise<ShiftType[]> {
    return this.prisma.shiftType.findMany({
      where: { organizationId },
    });
  }
}
