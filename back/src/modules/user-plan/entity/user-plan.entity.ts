import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlanRequestEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }) id!: string;
  @ApiProperty({ example: '...' }) userId!: string;
  @ApiProperty({ example: '...' }) coachId!: string;
  @ApiPropertyOptional({ example: '...', nullable: true }) workoutTemplateId?: string | null;
  @ApiPropertyOptional({ example: '...', nullable: true }) dietTemplateId?: string | null;
  @ApiProperty({ type: [String], example: [] }) images!: string[];
  @ApiPropertyOptional({ example: 'درخواست برنامه', nullable: true }) note?: string | null;
  @ApiPropertyOptional({ example: 15, nullable: true }) commissionRate?: number | null;
  @ApiPropertyOptional({ example: 50000, nullable: true }) discountAmount?: number | null;
  @ApiPropertyOptional({ example: 500000, nullable: true }) price?: number | null;
  @ApiPropertyOptional({ example: 550000, nullable: true }) originalPrice?: number | null;
  @ApiProperty({ enum: ['PENDING','ACCEPTED','PAID','DELIVERED','REJECTED','CANCELLED'], example: 'PENDING' }) status!: string;
  @ApiPropertyOptional({ example: null, nullable: true }) rejectionReason?: string | null;
  @ApiPropertyOptional({ example: null, nullable: true }) respondedAt?: Date | null;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) createdAt!: Date;
  @ApiPropertyOptional({  }) coach?: { id: string; title: string; slug: string };
}

export class UserPlanEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }) id!: string;
  @ApiProperty({ example: '...' }) userId!: string;
  @ApiProperty({ example: 'برنامه من' }) title!: string;
  @ApiProperty({ enum: ['DRAFT','ACTIVE','COMPLETED','CANCELLED'], example: 'ACTIVE' }) status!: string;
  @ApiProperty({ enum: ['COACH','SITE','AI'], example: 'COACH' }) source!: string;
  @ApiProperty({ enum: ['WORKOUT','DIET','ALL'], example: 'WORKOUT' }) type!: string;
  @ApiPropertyOptional({ example: '...', nullable: true }) workoutPlanId?: string | null;
  @ApiPropertyOptional({ example: '...', nullable: true }) dietPlanId?: string | null;
  @ApiPropertyOptional({ example: '...', nullable: true }) coachId?: string | null;
  @ApiPropertyOptional({ example: '...', nullable: true }) requestId?: string | null;
  @ApiPropertyOptional({  nullable: true, description: 'snapshot تمرین (JSON)' })
  snapshotExercise?: Record<string, any> | null;
  @ApiPropertyOptional({  nullable: true, description: 'snapshot غذا (JSON)' })
  snapshotDiet?: Record<string, any> | null;
  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z', nullable: true }) startDate?: Date | null;
  @ApiPropertyOptional({ example: '2025-03-01T00:00:00.000Z', nullable: true }) endDate?: Date | null;
  @ApiPropertyOptional({ example: null, nullable: true }) activatedAt?: Date | null;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) customizedAt!: Date;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) updatedAt!: Date;
  @ApiPropertyOptional({  }) workoutPlan?: { id: string; title: string };
  @ApiPropertyOptional({  }) dietPlan?: { id: string; title: string };
  @ApiPropertyOptional({ type: PlanRequestEntity }) request?: PlanRequestEntity;
}