import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * تزئین‌کننده پارامتر برای دریافت اطلاعات کاربر احراز هویت‌شده در کنترلرها.
 *
 * این تزئین‌کننده اطلاعات را از `request.user` می‌گیرد که توسط گارد احراز هویت
 * (مثلاً AccessTokenGuard) قبل از اجرای کنترلر مقداردهی می‌شود.
 *
 * کاربردها:
 * - `@CurrentUser()` : کل شیء کاربر (همه اطلاعات)
 * - `@CurrentUser('id')` : فقط فیلد `id` کاربر
 * - `@CurrentUser('role')` : فقط فیلد `role` کاربر
 *
 * مثال:
 * ```ts
 * @Get('me')
 * @UseGuards(AccessTokenGuard)
 * getProfile(@CurrentUser() user: AuthEntities) { ... }
 *
 * @Post()
 * @UseGuards(AccessTokenGuard)
 * create(@CurrentUser('id') userId: string) { ... }
 * ```
 *
 * @param data فیلد مشخص از شیء کاربر (اختیاری). اگر ارسال نشود، کل شیء کاربر برگشت داده می‌شود.
 * @param ctx ExecutionContext برای دسترسی به شیء درخواست.
 * @returns کل شیء کاربر یا مقدار فیلد مشخصی از آن.
 */
export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: Record<string, unknown> }>();
    const user = request.user;

    if (!user) {
        throw new Error('کاربر در درخواست یافت نشد؛ مطمئن شوید گارد احراز هویت قبل از کنترلر اجرا می‌شود.');
    }

    // اگر فیلد مشخصی درخواست نشده، کل شیء کاربر را برگردان
    return data ? user[data] : user;
});
