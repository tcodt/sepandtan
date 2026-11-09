import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from "class-validator";
import { ExperienceLevel } from "../../../generated/prisma/enums.js";
import { QueryDefaultDto } from "../../../common/dtos/query.defualt.dto.js";

export class CreateSpecialtyDto {
    @ApiProperty({
        description: 'اسلاگ تخصص ها باید به صورت یکتا باشن و غیر تکراری',
        example: 'bodybuilding',
    })
    @IsString()
    @MaxLength(200)
    slug!: string;

    @ApiProperty({
        description: 'نام تخصص به فارسی',
        example: 'فیزیک',
    })
    @IsString()
    @MaxLength(200)
    title!: string;
}

export class CreateFoodDto {
    @ApiProperty({
        description: 'نام غذا',
        example: 'سینه مرغ پخته',
    })
    @IsString()
    @MaxLength(200)
    name!: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ example: false, description: '' })
    isActive?: boolean;

    @ApiProperty({
        description: 'کالری در هر ۱۰۰ گرم',
        example: 165,
        minimum: 0,
    })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    caloriesPer100g!: number;

    @ApiPropertyOptional({
        description: 'پروتئین در هر ۱۰۰ گرم (گرم)',
        example: 31,
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    proteinPer100g?: number;

    @ApiPropertyOptional({
        description: 'کربوهیدرات در هر ۱۰۰ گرم (گرم)',
        example: 0,
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    carbsPer100g?: number;

    @ApiPropertyOptional({
        description: 'چربی در هر ۱۰۰ گرم (گرم)',
        example: 3.6,
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    fatPer100g?: number;
}

export class CreateExerciseDto {
    @ApiProperty({
        description: 'عنوان تمرین',
        example: 'پرس سینه با هالتر',
    })
    @IsString()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ example: false, description: 'پذیرش دارد یا خیر' })
    isActive?: boolean;

    @ApiProperty({
        description: 'عنوان تمرین',
        example: 'پرس سینه با هالتر',
    })
    @IsString()
    @MaxLength(200)
    slug!: string;

    @ApiPropertyOptional({
        description: 'توضیحات تمرین',
        example: 'تمرین برای عضلات سینه...',
        maxLength: 2000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @ApiPropertyOptional({
        description: 'نکات مهم (آرایه)',
        type: [String],
        example: ['کمر صاف باشد', 'نفس را حبس نکنید'],
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    notic?: string[];

    @ApiPropertyOptional({
        description: 'مراحل انجام (آرایه)',
        type: [String],
        example: ['هالتر را بگیرید', 'آرام پایین بیاورید', 'بالا ببرید'],
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    stepAction?: string[];

    @ApiPropertyOptional({
        enum: [...Object.values(ExperienceLevel)],
        description: 'سطح تمرین',
        example: 'BEGINNER',
        default: 'BEGINNER',
    })
    @IsOptional()
    @IsEnum(ExperienceLevel)
    level?: ExperienceLevel;

    @ApiPropertyOptional({
        description: 'مدت زمان (دقیقه)',
        example: 15,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    durationMin?: number;

    @ApiPropertyOptional({
        description: 'حداقل کالری سوزانده‌شده',
        example: 50,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    caloriesMin?: number;

    @ApiPropertyOptional({
        description: 'حداکثر کالری سوزانده‌شده',
        example: 120,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    caloriesMax?: number;

    @ApiPropertyOptional({
        description: 'آدرس GIF',
        example: 'https://cdn.example.com/exercise/bench-press.gif',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    gif?: string;

    @ApiPropertyOptional({
        description: 'آدرس ویدئو',
        example: 'https://cdn.example.com/exercise/bench-press.mp4',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    video?: string;

    @ApiPropertyOptional({
        description: 'داده‌های اضافی (JSON)',
        example: { tips: ['...'], alternatives: ['...'] },
    })
    @IsOptional()
    @IsObject()
    extraData?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'آدرس تصویر کاور',
        example: 'https://cdn.example.com/exercise/cover.jpg',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    coverImg?: string;

    @ApiPropertyOptional({
        description: 'آیدی دسته بندی',
        example: 'uuid',
    })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({
        description: 'آیدی عضلات درگیر (many-to-many)',
        type: [String],
        example: ['uuid-1', 'uuid-2'],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    muscleIds?: string[];

    @ApiPropertyOptional({
        description: 'آیدی تجهیزات مورد نیاز (many-to-many)',
        type: [String],
        example: ['uuid-1', 'uuid-2'],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    equipmentIds?: string[];
}

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) { }

export class CreateTrainingGoalDto {
    @ApiProperty({
        description: 'عنوان هدف تمرینی',
        example: 'افزایش حجم عضلانی',
    })
    @IsString()
    @MaxLength(200)
    title!: string;

    @ApiPropertyOptional({
        description: 'آدرس لوگو',
        example: 'https://cdn.example.com/goal/muscle-gain.png',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    logo?: string;

    @ApiPropertyOptional({
        description: 'توضیحات',
        example: 'برنامه‌های ویژه افزایش حجم...',
        maxLength: 2000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @ApiPropertyOptional({
        description: 'ترتیب نمایش',
        example: 1,
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

export class CreateEquipmentDto {
    @ApiProperty({
        description: 'عنوان تجهیزات',
        example: 'هالتر',
    })
    @IsString()
    @MaxLength(200)
    title!: string;

    @ApiProperty({
        description: 'اسلاگ',
        example: 'slug',
    })
    @IsString()
    @MaxLength(200)
    slug!: string;

    @ApiPropertyOptional({
        description: 'آدرس تصویر',
        example: 'https://cdn.example.com/equipment/barbell.png',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    image?: string;

    @ApiPropertyOptional({
        description: 'توضیحات',
        example: 'هالتر المپیک ۲۰ کیلوگرمی',
        maxLength: 2000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}

export class CreateMuscleGroupDto {
    @ApiProperty({
        description: 'اسلاگ (یکتا، از سمت فرانت ساخته می‌شود)',
        example: 'chest',
    })
    @IsString()
    @MaxLength(100)
    slug!: string;

    @ApiProperty({
        description: 'عنوان گروه عضلانی',
        example: 'سینه',
    })
    @IsString()
    @MaxLength(200)
    title!: string;
}

export class ArrayIdDto {
    @ApiPropertyOptional({
        description: 'آیدی رکوردها (آرایه UUID)',
        type: [String],
        example: ['57635d56-30ab-4aae-8146-c24a2e50f3e0'],
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null) return value;
        if (typeof value === 'string') return [value];
        return value;
    })
    @IsArray()
    @ArrayMaxSize(20)
    @IsUUID('4', { each: true, message: 'هر آیتم باید یک UUID معتبر باشد' })
    ids?: string[];
}

export class SearchFoodDto extends QueryDefaultDto {
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ description: 'فعال یا غیر فعال' })
    isActive?: boolean;

    @IsOptional()
    @ApiProperty({
        required: false,
        description: 'نام غذا',
    })
    @IsString()
    name?: string;
}

export class SearchExerciseDto extends QueryDefaultDto {
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ description: 'فعال یا غیر فعال' })
    isActive?: boolean;

    @IsOptional()
    @ApiProperty({
        description: 'نام ورزش',
        required: false
    })
    @IsString()
    title?: string;
}