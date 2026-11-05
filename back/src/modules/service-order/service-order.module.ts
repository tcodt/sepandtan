import { Module } from "@nestjs/common";
import { ServiceOrderController } from "./service-order.controller.js";
import { ServiceOrderService } from "./service-order.service.js";

@Module({
  controllers: [ServiceOrderController],
  providers: [ServiceOrderService],
  exports: [ServiceOrderService],
})
export class ServiceOrderModule {}