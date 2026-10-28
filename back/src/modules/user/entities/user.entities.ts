import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ActivityLevel,
  ExperienceLevel,
  TrainingLocation,
  Gender,
  RolePerson,
  UserStatus,
} from '../../../generated/prisma/enums.js';
import { IsBoolean } from 'class-validator';
export class UserEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  phone?: string

  @ApiProperty({ enum: RolePerson })
  role?: RolePerson

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus

  @ApiProperty()
  @IsBoolean()
  isEmailVerified: boolean

  @ApiProperty()
  @IsBoolean()
  isPhoneVerified: boolean
}

// src/users/dto/user-profile-response.dto.ts


export class TrainingGoalSummaryDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'افزایش حجم' })
  title: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png', nullable: true })
  logo: string | null;
}

export class ProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  avatar: string | null;

  @ApiPropertyOptional({ nullable: true })
  firstName: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastName: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 180 })
  heightCm: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 75.5 })
  currentWeightKg: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 70 })
  targetWeightKg: number | null;

  @ApiPropertyOptional({ enum: ActivityLevel, nullable: true })
  activityLevel: ActivityLevel | null;

  @ApiPropertyOptional({ enum: ExperienceLevel, nullable: true })
  experienceLevel: ExperienceLevel | null;

  @ApiPropertyOptional({ enum: Gender, nullable: true })
  gender: Gender | null;

  @ApiPropertyOptional({ enum: TrainingLocation, nullable: true })
  trainingLocation: TrainingLocation | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  age: Date | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 4 })
  trainingDaysPerWeek: number | null;

  @ApiProperty({ type: [String], example: ['dumbbell', 'barbell'] })
  availableEquipment: string[];

  @ApiPropertyOptional({ nullable: true })
  injuries: string | null;

  @ApiPropertyOptional({ nullable: true })
  medicalConditions: string | null;

  @ApiProperty({ type: [String], example: ['peanut'] })
  allergies: string[];

  @ApiProperty({ type: [String], example: ['vegan'] })
  dietaryRestrictions: string[];

  @ApiPropertyOptional({ nullable: true })
  trainingGoalId: string | null;

  @ApiProperty({ example: false })
  onboardingCompleted: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => TrainingGoalSummaryDto, nullable: true })
  trainingGoal: TrainingGoalSummaryDto | null;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'علی رضایی' })
  name: string;

  @ApiPropertyOptional({ nullable: true, example: 'ali@example.com' })
  email: string | null;

  @ApiPropertyOptional({ nullable: true, example: '09121234567' })
  phone: string | null;

  @ApiProperty({ enum: RolePerson, example: RolePerson.USER })
  role: RolePerson;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiProperty({ example: false })
  isPhoneVerified: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiPropertyOptional({ type: () => ProfileDto, nullable: true })
  profile: ProfileDto | null;
}