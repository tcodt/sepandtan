// src/filters/prisma.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(PrismaExceptionFilter.name);

    catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // لاگ خطا برای توسعه‌دهندگان
        this.logger.error(
            `Prisma Error Code: ${exception.code}, Message: ${exception.message}`,
            exception.stack,
        );

        const { message, statusCode } = this.getErrorMessage(exception);

        response.status(statusCode).json({
            success: false,
            statusCode,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }

    private getErrorMessage(exception: PrismaClientKnownRequestError): {
        message: string;
        statusCode: number;
    } {
        switch (exception.code) {
            // خطاهای اعتبار سنجی - پرتکرارترین ها
            case 'P2002':
                return {
                    message: this.getUniqueConstraintMessage(exception),
                    statusCode: HttpStatus.CONFLICT,
                };

            case 'P2003':
                return {
                    message: this.getForeignKeyMessage(exception),
                    statusCode: HttpStatus.BAD_REQUEST,
                };

            case 'P2025':
                return {
                    message: 'رکورد مورد نظر یافت نشد',
                    statusCode: HttpStatus.NOT_FOUND,
                };

            // خطاهای مقدار نامعتبر
            case 'P2006':
                return {
                    message: 'مقدار وارد شده برای فیلد مورد نظر قابل قبول نیست',
                    statusCode: HttpStatus.BAD_REQUEST,
                };

            case 'P2011':
                return {
                    message: 'فیلد اجباری نمی‌تواند خالی باشد',
                    statusCode: HttpStatus.BAD_REQUEST,
                };

            // خطاهای ارتباط با پایگاه داده
            case 'P2024':
                return {
                    message: 'اتصال به پایگاه داده timeout خورد. لطفا مجددا تلاش کنید',
                    statusCode: HttpStatus.REQUEST_TIMEOUT,
                };

            // خطاهای پیش‌فرض برای سایر موارد
            default:
                return {
                    message: 'خطای سرور لطفا بعدا تلاش کنید',
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                };
        }
    }

    private getUniqueConstraintMessage(exception: PrismaClientKnownRequestError): string {
        const target = exception.meta?.target as string[];

        if (!target || target.length === 0) {
            return 'رکوردی با این مشخصات قبلا ثبت شده است';
        }

        const fieldName = target[0];
        const fieldMap: { [key: string]: string } = {
            'email': 'ایمیل',
            'sku': 'کد کالا (SKU)',
            'slug': 'اسلاگ',
            'name': 'نام',
            'trackingCode': 'کد رهگیری',
            'tokenHash': 'توکن',
            'phone': 'شماره تلفن',
            'title': 'عنوان',
            'code': 'کد',
            'Code': 'کد تخفیف'
        };

        const persianName = fieldMap[fieldName] || fieldName;
        return `رکوردی با این ${persianName} قبلا ثبت شده است`;
    }

    private getForeignKeyMessage(exception: PrismaClientKnownRequestError): string {
        const constraint = exception.meta?.constraint as string;
        if (!constraint) {
            return 'مقدار ارجاع شده معتبر نیست';
        }
        const match = constraint.match(/(.*)_(.*)_fkey/);
        if (match && match[2]) {
            const fieldName = match[2];
            const fieldMap: { [key: string]: string } = {
                'userId': 'کاربر',
                'authorId': 'نویسنده',
                'authorIdUpdate': 'ویرایش‌کننده',
                'categoryId': 'دسته‌بندی',
                'discountId': 'تخفیف',
                'productId': 'محصول',
                'orderId': 'سفارش',
                'parentId': 'والد',
                'addressId': 'آدرس',
                'tokenId': 'توکن',
                'commentId': 'نظر',
                'wishlistId': 'لیست علاقه‌مندی',
                'cartId': 'سبد خرید',
                'paymentId': 'پرداخت',
                'orderItemId': 'آیتم سفارش'
            };

            const persianName = fieldMap[fieldName] || fieldName;
            const modelName = match[1]; // نام جدول از constraint
            const modelMap: { [key: string]: string } = {
                'addresses': 'آدرس',
                'tokens': 'توکن',
                'products': 'محصول',
                'categorys': 'دسته‌بندی',
                'discounts': 'تخفیف',
                'comments': 'نظر',
                'wishlists': 'لیست علاقه‌مندی',
                'carts': 'سبد خرید',
                'orders': 'سفارش',
                'payments': 'پرداخت',
                'order_items': 'آیتم سفارش'
            };

            const modelPersianName = modelMap[modelName] || modelName;
            return `${persianName} انتخاب شده برای ${modelPersianName} معتبر نیست`;
        }

        return 'مقدار ارجاع شده معتبر نیست';
    }
}