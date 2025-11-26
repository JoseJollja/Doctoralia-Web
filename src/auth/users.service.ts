import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly defaultAdminUsername = process.env.ADMIN_USERNAME;
  private readonly defaultAdminPassword = process.env.ADMIN_PASSWORD;

  constructor(private readonly database: DatabaseService) {}

  async onModuleInit() {
    await this.initializeAdminUser();
  }

  async initializeAdminUser(): Promise<void> {
    if (!this.defaultAdminUsername || !this.defaultAdminPassword) {
      this.logger.warn(
        'ADMIN_USERNAME or ADMIN_PASSWORD not set. Admin user will not be created.',
      );
      return;
    }

    try {
      const adminUser = await this.database.user.findUnique({
        where: { username: this.defaultAdminUsername },
      });

      if (!adminUser) {
        const hashedPassword = await bcrypt.hash(this.defaultAdminPassword, 10);

        await this.database.user.create({
          data: {
            username: this.defaultAdminUsername,
            password: hashedPassword,
            role: 'admin',
          },
        });

        this.logger.log('Admin user initialized');
      }
    } catch (error) {
      this.logger.error('Error initializing admin user:', error);
    }
  }

  async findByUsername(username: string) {
    return this.database.user.findUnique({
      where: { username },
    });
  }
}
