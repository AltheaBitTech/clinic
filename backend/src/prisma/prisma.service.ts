import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    // Prisma's interactive-transaction defaults (maxWait 2s, timeout 5s) are
    // too tight for multi-line stock operations (dispense, sales) against a
    // remote DB: each line issues several sequential queries, so a few items
    // exceed 5s and Prisma aborts with P2028.
    super({ adapter, transactionOptions: { maxWait: 10_000, timeout: 30_000 } });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}

