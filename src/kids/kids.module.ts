import { Module } from '@nestjs/common';
import { KidsService } from './kids.service';

@Module({
  providers: [KidsService]
})
export class KidsModule {}
