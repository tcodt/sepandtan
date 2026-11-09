import { Module } from "@nestjs/common";
import { ServiceOrderController } from "./service-order.controller.js";
import { ServiceOrderService } from "./service-order.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [ServiceOrderController],
  providers: [ServiceOrderService],
  exports: [ServiceOrderService],
})
export class ServiceOrderModule { }