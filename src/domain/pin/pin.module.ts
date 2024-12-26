import { Module } from "@nestjs/common";
import { PinService } from "./pin.service";

@Module({
  providers: [PinService],
  exports: [PinService]
})
export class PinModule{}
