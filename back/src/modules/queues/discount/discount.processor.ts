// queues/discount/discount.processor.ts
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { VariantsService } from '../../variants/variants.service.js';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import pLimit from 'p-limit';
import { PrismaService } from '../../../prisma/prisma.service.js';
@Processor('discount-queue', {
  concurrency: 3,                      // ✅ حداکثر ۳ تخفیف همزمان پردازش بشه
  limiter: { max: 10, duration: 1000 }, // ✅ حداکثر ۱۰ job در ثانیه شروع بشه
})
export class DiscountProcessor extends WorkerHost {
  private readonly logger = new Logger(DiscountProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly variantsService: VariantsService,
  ) {
    super();
  }

  private async checkDiscount(id: string) {
    const discount = await this.prisma.discountCode.findUnique({ where: { id: id } })
    return discount
  }

  async process(job: Job) {
    switch (job.name) {
      case 'expire-discount': {
        const exists = await this.checkDiscount(job.data.discountId);
        if (!exists) return;
        await this.prisma.discountCode.update({
          where: { id: job.data.discountId },
          data: { isActive: false },
        });
        if (exists.status === 'PRODUCT') {
          await this.syncAffectedProducts(job.data.discountId);
        }
        break;
      }
      case 'activate-discount': {
        const exists = await this.checkDiscount(job.data.discountId);
        if (!exists) return;
        await this.prisma.discountCode.update({
          where: { id: job.data.discountId },
          data: { isActive: true },
        });
        if (exists.status === 'PRODUCT') {
          await this.syncAffectedProducts(job.data.discountId);
        }
        break;
      }
      case 'sync-discount': {
        const exists = await this.checkDiscount(job.data.discountId);
        if (!exists) return;
        if (exists.status === 'PRODUCT') {
          await this.syncAffectedProducts(job.data.discountId);
        }
        break;
      }
      case 'sync-products': {
        await this.syncProductsBatch(job.data.productIds);
        break;
      }
      default: {
        this.logger.warn(`Unknown job name received: ${job.name}`)
      }
    }
  }

  private async syncAffectedProducts(discountId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { discountId },
      select: { productId: true },
      distinct: ['productId'],
    });
    await this.syncProductsBatch(variants.map((v) => v.productId));
  }

  private async syncProductsBatch(productIds: string[]) {
    if (productIds.length === 0) return;

    const limit = pLimit(5);
    const results = await Promise.allSettled(
      productIds.map((id) => limit(() => this.variantsService.syncProductPricing(id))),
    );

    const failed = results
      .map((r, i) => ({ r, productId: productIds[i] }))
      .filter(({ r }) => r.status === 'rejected');

    if (failed.length > 0) {
      this.logger.warn(
        `Sync failed for products: ${failed.map((f) => f.productId).join(', ')}`,
      );
      throw new Error(`${failed.length}/${productIds.length} محصول sync نشد`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} (${job.name}) failed: ${err.message}`);
  }
}