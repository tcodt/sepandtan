import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { WalletModule } from "../wallet/wallet.module.js";
import { ServiceOrderController } from "./service-order.controller.js";
import { ServiceOrderService } from "./service-order.service.js";

@Module({
  imports: [AuthModule, WalletModule], // WalletModule باید PlatformWalletService را export کند
  controllers: [ServiceOrderController],
  providers: [ServiceOrderService],
  exports: [ServiceOrderService],
})
export class ServiceOrderModule { }