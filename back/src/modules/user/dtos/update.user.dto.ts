import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUrl, IsUUID, Max, MaxLength, Min, } from 'class-validator';
import { ActivityLevel, CoachStatus, DefaultStatus, ExperienceLevel, Gender, RolePerson, TrainingLocation, UserStatus } from '../../../generated/prisma/enums.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'ali 123' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: RolePerson, example: 'USER' })
  @IsOptional()
  @IsEnum(RolePerson)      // ← @IsString کافی نیست، enum است
  role?: RolePerson;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '09390199977' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'r.khani1385@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: [...Object.values(UserStatus)] })
  @IsOptional()
  @IsIn([...Object.values(UserStatus)])
  status?: UserStatus;
}
export class UpdateProfileDto {
  // ===== اطلاعات شخصی =====
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png', nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'آدرس آواتار معتبر نیست' })
  avatar?: string | null;

  @ApiPropertyOptional({ example: 'علی', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'رضایی', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string | null;

  // ===== بدن =====

  @ApiPropertyOptional({ example: 180, description: 'قد به سانتی‌متر', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'قد باید عدد باشد' })
  @Min(50)
  @Max(250)
  heightCm?: number | null;

  @ApiPropertyOptional({ example: 75.5, description: 'وزن فعلی به کیلوگرم', nullable: true })
  @IsOptional()
  @IsNumber()
  currentWeightKg?: number | null;

  @ApiPropertyOptional({ example: 70, description: 'وزن هدف به کیلوگرم', nullable: true })
  @IsOptional()
  @IsNumber()
  targetWeightKg?: number | null;

  // ===== اطلاعات پروفایل برای جستجو =====

  @ApiPropertyOptional({ description: 'سطح فعالیت کاربر', enum: ActivityLevel, nullable: true })
  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel | null;

  @ApiPropertyOptional({ description: 'تجربه ورزش کاربر', enum: ExperienceLevel, nullable: true })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel | null;

  @ApiPropertyOptional({ description: 'جنسیت', enum: Gender, nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null;

  @ApiPropertyOptional({ description: 'مکان تمرین', enum: TrainingLocation, nullable: true })
  @IsOptional()
  @IsEnum(TrainingLocation)
  trainingLocation?: TrainingLocation | null;

  @ApiPropertyOptional({
    example: '2026-10-24T22:19:46.530Z',
    type: String,
    description: 'لطفا فرمت تاریخ ارسال کنید',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  age?: string | null; // ورودی string می‌گیریم، در سرویس به Date تبدیل می‌شود

  @ApiPropertyOptional({ description: 'تعداد روزهایی که در هفته میتواند تمرین', example: 4, minimum: 1, maximum: 7, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek?: number | null;

  @ApiPropertyOptional({
    description: 'تجهیزاتی که کاربر داره',
    type: [String],
    example: ['dumbbell', 'barbell', 'bench'],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableEquipment?: string[];

  // ===== سلامت و تغذیه =====

  @ApiPropertyOptional({ description: 'آسیب های جسمی', example: 'کمردرد مزمن و شکستگی پا', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  injuries?: string | null;

  @ApiPropertyOptional({ description: 'بیماری های پزشکی که کاربر داره', example: 'فشار خون بالا', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  medicalConditions?: string | null;

  @ApiPropertyOptional({ description: 'مواردی که کاربر به آنها حساسیت دارد', type: [String], example: ['peanut', 'lactose'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ description: 'موارد خوراکی که کاربر علاقه ای به خوردن آنها ندارد و یا شرایط مصرف آنها را ندارد', type: [String], example: ['گوشت خوار', 'فیله گاو'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryRestrictions?: string[];

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'شناسه TrainingGoal',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  trainingGoalId?: string | null;

  // ===== وضعیت =====

  @ApiPropertyOptional({ description: 'اتمام مراحل آموزشی کاربر برای فرانت', example: true })
  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}

export class UpdateStoreByAdminDto {
  @IsOptional()
  @IsIn([...Object.values(DefaultStatus)])
  @ApiProperty({
    enum: [...Object.values(DefaultStatus)],
    required: false,
    description: 'وضعیت فروشنده',
  })
  status?: DefaultStatus;

  @ApiPropertyOptional({ example: 'توضیحات مربوطه درباره رد فروشنده', nullable: true })
  @IsOptional()
  @IsString()
  statusReason?: string
}

export class UpdateCoachByAdminDto {
  @IsOptional()
  @IsIn([...Object.values(CoachStatus)])
  @ApiProperty({
    enum: [...Object.values(CoachStatus)],
    required: false,
    description: 'وضعیت مربی',
  })
  status?: CoachStatus;

  @ApiPropertyOptional({ example: 'توضیحات مربوطه درباره رد مربی', nullable: true })
  @IsOptional()
  @IsString()
  rejectionReason?: string
}