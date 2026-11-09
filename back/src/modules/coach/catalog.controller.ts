/**
 * CoachsController - کنترلر مربی‌ها
 */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { ApprovedCoachReviewDto, CreateAchievementDto, CreateAvailabilityDto, CreateCertificationDto, CreateCoachDto, CreateCoachReviewDto, SearchAdminCoachDto, SearchCoachDto, SearchCoachReview, UpdateAchievementDto, UpdateAvailabilityDto, UpdateCertificationDto, UpdateCoachDto, UpdateCoachReviewDto } from './dto/coach.dto.js';
import { CoachService } from './coach.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RolePerson } from '../../generated/prisma/enums.js';
import { ReviewCoachService } from './review.service.js';
import { AchievementService } from './achievement.service.js';
import { SpecialtyService } from '../admin/specialty.service.js';
import { CertificationService } from './certification.service.js';
import { EquipmentEntity, ExerciseEntity, FoodEntity, MuscleGroupEntity, SpecialtyEntity, TrainingGoalEntity } from '../admin/entities/admin.entity.js';
import { ArrayIdDto, SearchExerciseDto } from '../admin/dto/admin.dto.js';
import { EquipmentService } from '../admin/equipment.service.js';
import { ExerciseService } from '../admin/exercise.service.js';
import { FoodService } from '../admin/food.service.js';
import { MuscleGroupService } from '../admin/muscleGroup.service.js';
import { TrainingGoalService } from '../admin/trainingGoal.service.js';
import { AvailableService } from './available.service.js';
import { AchievementEntity, AvailabilityEntity, CertificationEntity, CoachEntity, CoachSelectorEntity, ReviewCoachAdminEntity, ReviewCoachEntity } from './entities/coach.entity.js';
import { CoachDetailsEntity } from './entities/coachSlug.entity.js';


@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
    constructor(
        private readonly coachsService: CoachService,
        private readonly reviewService: ReviewCoachService,
        private readonly certificationService: CertificationService,
        private readonly achievementService: AchievementService,

        private readonly specialtyService: SpecialtyService,
        private readonly equipmentService: EquipmentService,
        private readonly exerciseService: ExerciseService,
        private readonly foodService: FoodService,
        private readonly muscleGroupService: MuscleGroupService,
        private readonly trainingGoalService: TrainingGoalService,
    ) { }

    @Get('coach')
    @ApiOkResponse({ type: PaginatedResponse(CoachSelectorEntity, 'coach') })
    @ApiOperation({ summary: 'لیست مربی‌های فعال (Public)' })
    async findAll(@Query() query: SearchCoachDto) {
        return this.coachsService.findAll(query);
    }

    @Get('coach/selector')
    @ApiOperation({ summary: 'لیست مربی‌های فعال برای فرم‌های انتخاب‌گر (Public)' })
    @ApiOkResponse({ type: PaginatedResponse(CoachSelectorEntity, 'coach') })
    async getForSelector() {
        return this.coachsService.getForSelector();
    }

    @Get('coach/:slug')
    @ApiOkResponse({ type: CoachDetailsEntity })
    @ApiOperation({ summary: 'جزئیات مربی بر اساس slug (Public)' })
    async findBySlug(@Param('slug') slug: string) {
        return this.coachsService.findBySlug(slug);
    }

    ///// Review /////
    @Get('/review/coach')
    @ApiOkResponse({ type: PaginatedResponse(ReviewCoachEntity, 'reviews') })
    @ApiOperation({ summary: 'لیست نظرات یک مربی (Public)', description: 'بر اساس آیدی مربی، نظرات را برمی‌گرداند' })
    async reviewCoach(@Query('coachId') coachId: string, @Query() query: QueryDefaultDto) {
        return this.reviewService.getReviewCoach(coachId, query);
    }

    @Post('/review')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ثبت نظر برای مربی (User)', description: 'کاربر لاگین‌شده برای مربی نظر ثبت می‌کند' })
    async createReview(@CurrentUser('id') authorId: string, @Body() dto: CreateCoachReviewDto) {
        return this.reviewService.addReviewCoach(authorId, dto);
    }
    ///// Certification /////
    @Get('/certification/:coachId')
    @ApiOkResponse({ type: [CertificationEntity] })
    @ApiOperation({ summary: 'لیست مدارک تأییدشده مربی (Public)' })
    async getCertificationCoach(@Param('coachId') coachId: string) {
        return this.certificationService.getAllCertificationCoach(coachId);
    }
    ///// Specialty /////
    @Get('specialty/:coachId')
    @ApiOkResponse({ type: [SpecialtyEntity] })
    @ApiOperation({ summary: 'لیست تخصص یک مربی (Coach)' })
    getSpecialty(@Param('coachId') coachId: string) {
        return this.specialtyService.getOne(coachId);
    }

    ///// Achievement /////
    @Get('/achievement/:coachId')
    @ApiOkResponse({ type: PaginatedResponse(AchievementEntity, 'achievement') })
    @ApiOperation({ summary: 'لیست دستاوردهای تأییدشده یک مربی (Public)' })
    async getAchievementCoach(@Param('coachId') coachId: string, @Query() query: QueryDefaultDto) {
        return this.achievementService.getAllAchievementCoach(coachId, query);
    }

    ///// Equipment /////
    @Get('equipment')
    @ApiOkResponse({ type: [EquipmentEntity] })
    @ApiOperation({ summary: 'لیست تجهیزات (User & Coach)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس عنوان تجهیزات' })
    getEquipment(@Query('title') title: string, @Query() query: QueryDefaultDto) {
        return this.equipmentService.getAll(title, query);
    }

    @Get('equipment/selector')
    @ApiOkResponse({ type: [EquipmentEntity] })
    @ApiOperation({ summary: 'لیست انتخابگر تجهیزات (User & Coach)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس عنوان تجهیزات' })
    selectEquipment(@Query('title') title: string) {
        return this.equipmentService.getSelector(title);
    }

    @Get('equipment/my')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ type: [EquipmentEntity] })
    @ApiOperation({ summary: 'لیست تجهیزات من(User)' })
    myEquipment(@CurrentUser('id') userId: string) {
        return this.equipmentService.getMy(userId);
    }

    @Patch('equipment')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'افزودن و ویرایش تجهیزات کاربر (User)', description: 'زمانی که کاربر میخواد تجهیزاتی که داره رو ثبت بکنه تجهیزات رو بهش نمایش بده به صورت انتخابگر و اونایی که دارن رو انتخاب بکنه و بعد ایدی هاشونو به صورت لیست بفرسته' })
    updateEquipmentCoach(@CurrentUser('id') userId: string, @Query() ids: ArrayIdDto) {
        return this.equipmentService.updateTableUser(userId, ids);
    }

    ///// Exercise /////

    @Get('exercise')
    @ApiOkResponse({ type: [ExerciseEntity] })
    @ApiOperation({ summary: 'لیست تمرین (User & Coach)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس عنوان تمرین' })
    getExercise(@Query('title') title: string, @Query() query: SearchExerciseDto) {
        return this.exerciseService.getAll(title, query);
    }

    @Get('exercise/selector')
    @ApiOkResponse({ type: [ExerciseEntity] })
    @ApiOperation({ summary: 'لیست تمرین انتخابگر(User & Coach)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس عنوان تمرین' })
    selectExercise(@Query('title') title: string) {
        return this.exerciseService.getSelector(title);
    }

    @Get('exercise/:slug')
    @ApiOkResponse({ type: ExerciseEntity })
    @ApiOperation({ summary: 'تمرین تکی(User & Coach)' })
    getOneExercise(@Param('slug') slug: string) {
        return this.exerciseService.getOne(slug);
    }

    /////  Food   /////

    @Get('food')
    @ApiOkResponse({ type: [FoodEntity] })
    @ApiOperation({ summary: 'لیست غذاها (Coach & User)' })
    @ApiQuery({ name: 'name', required: false, type: String, description: 'جستجو بر اساس نام غذاها' })
    getFood(@Query('name') name: string, @Query() query: QueryDefaultDto) {
        return this.foodService.getAll(name, query);
    }

    @Get('food/selector')
    @ApiOkResponse({ type: [FoodEntity] })
    @ApiOperation({ summary: 'لیست غذا انتخابگر(Coach & User)' })
    @ApiQuery({ name: 'name', required: false, type: String, description: 'جستجو بر اساس نام غذاها' })
    selectFood(@Query('name') name: string) {
        return this.foodService.getSelector(name);
    }
    /////  MuscleGroup   /////

    @Get('muscle-group')
    @ApiOkResponse({ type: [MuscleGroupEntity] })
    @ApiOperation({ summary: 'لیست گروه عضلانی (User & Coach)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس نام انتخابگر' })
    getMuscleGroup(@Query() query: QueryDefaultDto, @Query('title') title: string) {
        return this.muscleGroupService.getAll(title, query);
    }

    @Get('muscle-group/selector')
    @ApiOkResponse({ type: [MuscleGroupEntity] })
    @ApiOperation({ summary: 'لیست عضلانی انتخابگر(Coach & User)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس نام انتخابگر' })
    selectMuscleGroup(@Query('title') title: string) {
        return this.muscleGroupService.getSelector(title);
    }

    /////  TrainingGoal   /////
    @Get('training-goal')
    @ApiOkResponse({ type: [TrainingGoalEntity] })
    @ApiOperation({ summary: 'لیست هدف تمرینی (Coach & User)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس نام هدف تمرینی' })
    getTrainingGoal(@Query() query: QueryDefaultDto, @Query('title') title: string) {
        return this.trainingGoalService.getAll(title, query);
    }

    @Get('training-goal/selector')
    @ApiOkResponse({ type: [TrainingGoalEntity] })
    @ApiOperation({ summary: 'لیست هدف انتخابگر(Coach & User)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس نام هدف تمرینی' })
    selectTrainingGoal(@Query('title') title: string) {
        return this.trainingGoalService.getSelector(title);
    }
}