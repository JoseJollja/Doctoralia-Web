import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MigrationService } from './migration/services/migration.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors();
  
  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Run migration automatically on startup
  const migrationService = app.get(MigrationService);
  
  try {
    await migrationService.runMigration();
    logger.log('Migration process completed successfully');
  } catch (error) {
    logger.error('Migration process failed', error);
    process.exit(1);
  }
  
  // Start the server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
