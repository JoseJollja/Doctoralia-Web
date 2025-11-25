import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { MigrationModule } from './migration/migration.module';

@Module({
  imports: [DatabaseModule, MigrationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
