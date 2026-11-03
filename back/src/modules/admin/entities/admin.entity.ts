import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MuscleGroupEntity {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    id!: string;

    @ApiProperty({ example: 'chest' })
    slug!: string;

    @ApiProperty({ example: 'سینه' })
    title!: string;
}

export class EquipmentEntity {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    id!: string;

    @ApiProperty({ example: 'barbell' })
    slug!: string;

    @ApiProperty({ example: 'هالتر' })
    title!: string;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/equipment/barbell.png', nullable: true })
    image?: string | null;

    @ApiPropertyOptional({ example: 'هالتر المپیک ۲۰ کیلوگرمی', nullable: true })
    description?: string | null;
}

export class ExerciseEntity {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    id!: string;

    @ApiProperty({ example: 'bench-press' })
    slug!: string;

    @ApiProperty({ example: 'پرس سینه با هالتر' })
    title!: string;

    @ApiPropertyOptional({ example: 'تمرین برای عضلات سینه...', nullable: true })
    description?: string | null;

    @ApiProperty({ type: [String], example: ['کمر صاف باشد', 'نفس را حبس نکنید'] })
    notic!: string[];

    @ApiProperty({ type: [String], example: ['هالتر را بگیرید', 'آرام پایین بیاورید'] })
    stepAction!: string[];

    @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', nullable: true })
    categoryId?: string | null;

    @ApiProperty({ example: 'BEGINNER', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
    level!: string;

    @ApiPropertyOptional({ example: 15, nullable: true })
    durationMin?: number | null;

    @ApiPropertyOptional({ example: 50, nullable: true })
    caloriesMin?: number | null;

    @ApiPropertyOptional({ example: 120, nullable: true })
    caloriesMax?: number | null;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/exercise/bench-press.gif', nullable: true })
    gif?: string | null;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/exercise/bench-press.mp4', nullable: true })
    video?: string | null;

    @ApiPropertyOptional({  nullable: true })
    extraData?: Record<string, any> | null;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/exercise/cover.jpg', nullable: true })
    coverImg?: string | null;

    @ApiProperty({ example: true })
    isActive!: boolean;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    createdAt!: Date;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    updatedAt!: Date;
}

export class FoodEntity {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    id!: string;

    @ApiProperty({ example: 'سینه مرغ پخته' })
    name!: string;

    @ApiProperty({ example: 165 })
    caloriesPer100g!: number;

    @ApiProperty({ example: 31 })
    proteinPer100g!: number;

    @ApiProperty({ example: 0 })
    carbsPer100g!: number;

    @ApiProperty({ example: 3.6 })
    fatPer100g!: number;

    @ApiProperty({ example: true })
    isActive!: boolean;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    createdAt!: Date;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    updatedAt!: Date;
}

export class SpecialtyEntity {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    id!: string;

    @ApiProperty({ example: 'weight-loss' })
    slug!: string;

    @ApiProperty({ example: 'کاهش وزن' })
    title!: string;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    createdAt!: Date;
}

export class TrainingGoalEntity {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    id!: string;

    @ApiProperty({ example: 'افزایش حجم عضلانی' })
    title!: string;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/goal/muscle-gain.png', nullable: true })
    logo?: string | null;

    @ApiPropertyOptional({ example: 'برنامه‌های ویژه افزایش حجم...', nullable: true })
    description?: string | null;

    @ApiPropertyOptional({ example: 1, nullable: true })
    sortOrder?: number | null;
}