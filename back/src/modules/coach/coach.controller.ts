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


@ApiTags('Coach')
@Controller('catalog')
export class CoachsController {
    constructor(
        private readonly coachsService: CoachService,
        private readonly reviewService: ReviewCoachService,
        private readonly certificationService: CertificationService,
        private readonly achievementService: AchievementService,
        private readonly availableService: AvailableService,

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

    @Get('coach/admin')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOperation({ summary: 'لیست مربی‌ها توسط ادمین (Admin)', description: 'مربی‌ها با تمام جزئیات و مدارک/تخصص‌هایشان' })
    @ApiOkResponse({ type: PaginatedResponse(CoachEntity, 'coach') })
    async findAllAdmin(@Query() query: SearchAdminCoachDto) {
        return this.coachsService.findAllAdmin(query);
    }

    @Get('coach/admin/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'جزئیات مربی بر اساس آیدی (Admin)' })
    async findById(@Param('id') id: string) {
        return this.coachsService.findById(id);
    }

    @Get('coach/:slug')
    @ApiOkResponse({ type: CoachDetailsEntity })
    @ApiOperation({ summary: 'جزئیات مربی بر اساس slug (Public)' })
    async findBySlug(@Param('slug') slug: string) {
        return this.coachsService.findBySlug(slug);
    }

    @Post('coach')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ایجاد مربی جدید (Admin)', description: 'برای زمانی که کاربر دسترسی نداشته باشد و ادمین بخواهد مستقیماً مربی اضافه کند' })
    async create(@Body() dto: CreateCoachDto) {
        return this.coachsService.create(dto);
    }


    @Put('coach/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN', 'COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ویرایش مربی (Admin & Coach)' })
    async update(@Param('id') id: string, @Body() dto: UpdateCoachDto, @CurrentUser('role') role: RolePerson, @CurrentUser('id') userId: string) {
        return this.coachsService.update(id, dto, role, userId);
    }

    @Delete('coach/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'حذف مربی (Admin)' })
    async delete(@Param('id') id: string) {
        return this.coachsService.delete(id);
    }

    @Delete('coach-db/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('SUPERADMIN')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'حذف مربی از دیتابیس بسیار حساس (Super Admin)' })
    async deleteDb(@Param('id') id: string) {
        return this.coachsService.deleteDb(id);
    }

    ///// Review /////
    @Get('/review/coach')
    @ApiOkResponse({ type: PaginatedResponse(ReviewCoachEntity, 'reviews') })
    @ApiOperation({ summary: 'لیست نظرات یک مربی (Public)', description: 'بر اساس آیدی مربی، نظرات را برمی‌گرداند' })
    async reviewCoach(@Query('coachId') coachId: string, @Query() query: QueryDefaultDto) {
        return this.reviewService.getReviewCoach(coachId, query);
    }

    @Get('/review/admin')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ type: PaginatedResponse(ReviewCoachAdminEntity, 'reviews') })
    @ApiOperation({ summary: 'لیست همه نظرات مربی‌ها (Admin)', description: 'با فیلتر و جستجو' })
    async adminAllReviewCoach(@Query() query: SearchCoachReview) {
        return this.reviewService.getAdminAllReviewCoach(query);
    }

    @Get('/review')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ type: PaginatedResponse(ReviewCoachEntity, 'reviews') })
    @ApiOperation({ summary: 'لیست نظرات من یا مربیِ لاگین‌ شده (Coach)', description: 'نظراتی که برای این مربی ثبت شده است' })
    async coachAllReview(@Query() query: SearchCoachReview) {
        return this.reviewService.getAllReviewCoach(query);
    }

    @Post('/review')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ثبت نظر برای مربی (User)', description: 'کاربر لاگین‌شده برای مربی نظر ثبت می‌کند' })
    async createReview(@CurrentUser('id') authorId: string, @Body() dto: CreateCoachReviewDto) {
        return this.reviewService.addReviewCoach(authorId, dto);
    }

    @Post('/review/rebuild/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('SUPERADMIN')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'محاسبه مجدد امتیاز مربی (Super Admin)', description: 'امتیازهای مربی را از نو محاسبه می‌کند' })
    async rebuildCoachRating(@Param('id') coachId: string) {
        return this.reviewService.rebuildCoachRating(coachId);
    }

    @Put('/review/approve/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN', 'COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'تأیید نظر مربی (Admin & Coach)' })
    async approveReviewCoach(@Param('id') reviewId: string, @Body() answer: ApprovedCoachReviewDto) {
        return this.reviewService.approveReviewCoach(reviewId, answer);
    }

    @Patch('/review/status/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'تغییر وضعیت نظر مربی (Admin)' })
    async updateStatusCoach(@Param('id') reviewId: string, @Body() dto: UpdateCoachReviewDto) {
        return this.reviewService.updateStatusCoach(reviewId, dto);
    }

    @Delete('/review/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'حذف نظر مربی (Admin)' })
    async deleteReviewCoach(@Param('id') reviewId: string) {
        return this.reviewService.deleteReviewCoach(reviewId);
    }

    ///// Certification /////

    @Get('/certification/admin')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ type: PaginatedResponse(CertificationEntity, 'certification') })
    @ApiOperation({ summary: 'لیست همه مدارک مربی‌ها (Admin)', description: 'فیلتر اختیاری با coachId و صفحه‌بندی' })
    async getAdminCertification(@Query('coachId') coachId: string | undefined, @Query() query: QueryDefaultDto) {
        return this.certificationService.getAllAdmin(coachId, query);
    }

    @Get('/certification/my')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ type: [CertificationEntity] })
    @ApiOperation({ summary: 'لیست مدارک من (Coach)' })
    async myCertification(@CurrentUser('id') userId: string) {
        return this.certificationService.getMyCertification(userId);
    }

    @Get('/certification/:coachId')
    @ApiOkResponse({ type: [CertificationEntity] })
    @ApiOperation({ summary: 'لیست مدارک تأییدشده مربی (Public)' })
    async getCertificationCoach(@Param('coachId') coachId: string) {
        return this.certificationService.getAllCertificationCoach(coachId);
    }

    @Post('/certification')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ایجاد مدرک جدید (Coach)', description: 'مجاز به ساخت بیش از 10 مورد مدرک نیست' })
    async createCertification(@Body() body: CreateCertificationDto, @CurrentUser('id') userID: string) {
        return this.certificationService.createCertification(body, userID);
    }

    @Patch('/certification/admin/:id/verify')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ example: { success: true, message: 'مدرک تأیید شد' } })
    @ApiOperation({ summary: 'تأیید / لغو تأیید مدرک (Admin)' })
    async approveCertification(@Param('id') id: string) {
        return this.certificationService.changeVerify(id);
    }

    @Put('/certification/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ویرایش مدرک (Coach)' })
    async updateCertification(@Param('id') id: string, @Body() body: UpdateCertificationDto, @CurrentUser('id') userId: string) {
        return this.certificationService.updateCertification(id, body, userId);
    }

    @Delete('/certification/:id')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'حذف مدرک (Coach)' })
    async deleteCertification(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.certificationService.deleteCertification(id, userId);
    }

    ///// Availability /////
    @Get('/availability')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ type: [AvailabilityEntity] })
    @ApiOperation({ summary: 'لیست ساعات کاری من (Coach)' })
    async getAvailability(@CurrentUser('id') userId: string) {
        return this.availableService.getMyAvailable(userId);
    }

    @Post('/availability')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ایجاد بازه زمانی (Coach)', description: 'به تعداد روزهای هفته باید رکورد ساخته بشه و مجاز به ساخت رکورد تکراری نیست' })
    async createAvailability(@CurrentUser('id') userId: string, @Body() dto: CreateAvailabilityDto) {
        return this.availableService.createAvailable(userId, dto);
    }

    @Put('/availability/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ویرایش بازه زمانی (Coach)' })
    async updateAvailability(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateAvailabilityDto) {
        return this.availableService.updateAvailable(id, dto, userId);
    }

    @Delete('/availability/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'حذف بازه زمانی (Coach)' })
    async deleteAvailability(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.availableService.deleteAvailable(id, userId);
    }

    ///// Achievement /////

    @Get('/achievement/my')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ type: PaginatedResponse(AchievementEntity, 'achievement') })
    @ApiOperation({ summary: 'لیست دستاوردهای من (Coach)' })
    async getMyAchievement(@CurrentUser('id') userId: string, @Query() query: QueryDefaultDto) {
        return this.achievementService.getMyAchievement(userId, query);
    }

    @Get('/achievement/:coachId')
    @ApiOkResponse({ type: PaginatedResponse(AchievementEntity, 'achievement') })
    @ApiOperation({ summary: 'لیست دستاوردهای تأییدشده یک مربی (Public)' })
    async getAchievementCoach(@Param('coachId') coachId: string, @Query() query: QueryDefaultDto) {
        return this.achievementService.getAllAchievementCoach(coachId, query);
    }

    @Post('/achievement')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ایجاد دستاورد (Coach)' })
    async createAchievement(@CurrentUser('id') userId: string, @Body() dto: CreateAchievementDto) {
        return this.achievementService.createAchievement(userId, dto);
    }

    @Put('/achievement/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'ویرایش دستاورد (Coach)' })
    async updateAchievement(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateAchievementDto) {
        return this.achievementService.updateAchievement(id, dto, userId);
    }

    @Delete('/achievement/:id')
    @UseGuards(AccessTokenGuard)
    @Roles('COACH')
    @ApiOkResponse({ example: { success: true } })
    @ApiOperation({ summary: 'حذف دستاورد (Coach)' })
    async deleteAchievement(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.achievementService.deleteAchievement(id, userId);
    }

    @Patch('/achievement/admin/:id/verify')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ example: { success: true, message: 'دستاورد تأیید شد' } })
    @ApiOperation({ summary: 'تأیید / لغو تأیید دستاورد (Admin)' })
    async verifyAchievement(@Param('id') id: string) {
        return this.achievementService.changeVerify(id);
    }

    ///// Specialty /////

    @Get('specialty')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ type: [SpecialtyEntity] })
    @ApiOperation({ summary: 'لیست تخصص (User & Coach)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس عنوان تخصص' })
    getSpecialty(@Query('title') title: string, @Query() query: QueryDefaultDto) {
        return this.specialtyService.getAll(title, query);
    }

    @Get('specialty/selector')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ type: [SpecialtyEntity] })
    @ApiOperation({ summary: 'لیست انتخابگر تخصص (User & Coach)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس عنوان تخصص' })
    selectSpecialty(@Query('title') title: string) {
        return this.specialtyService.getSelector(title);
    }

    @Get('specialty/my')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ type: [SpecialtyEntity] })
    @ApiOperation({ summary: 'لیست تخصص  من(Coach)' })
    mySpecialty(@CurrentUser('id') id: string) {
        return this.specialtyService.getMy(id);
    }

    @Patch('specialty')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ example: { success: true } })
    @Roles('COACH')
    @ApiOperation({ summary: 'افزودن و ویرایش تخصص ها به مربی (Coach)', description: 'برای افزودن یا ویرایش تخصص ها به مربی باید ارایه ای از ایدی تخصص ها ارسال کنه' })
    updateSpecialty(@CurrentUser('id') userId: string, @Query() ids: ArrayIdDto) {
        return this.specialtyService.updateTable(userId, ids);
    }

    ///// Equipment /////
    @Get('equipment')
    @UseGuards(AccessTokenGuard)
    @ApiOkResponse({ type: [EquipmentEntity] })
    @ApiOperation({ summary: 'لیست تجهیزات (User & Coach)' })
    @ApiQuery({ name: 'title', required: false, type: String, description: 'جستجو بر اساس عنوان تجهیزات' })
    getEquipment(@Query('title') title: string, @Query() query: QueryDefaultDto) {
        return this.equipmentService.getAll(title, query);
    }

    @Get('equipment/selector')
    @UseGuards(AccessTokenGuard)
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
    @ApiOperation({ summary: ' تمرین تکی(User & Coach)' })
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