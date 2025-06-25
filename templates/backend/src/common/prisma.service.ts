import { Injectable, OnModuleInit, OnModuleDestroy, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { getTenantDbConfigByHost } from 'src/config/tenant-config';

@Injectable({ scope: Scope.REQUEST })
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly request: Request;

  constructor(@Inject(REQUEST) request: Request) {
    // const host = request['tenantHost'];
    // if (!host) {
    //   throw new Error('Tenant host is not provided in the request.');
    // }
    // const { url } = getTenantDbConfigByHost(host);
    // if (!url) {
    //   throw new Error(`No database URL found for host: ${host}`);
    // }
    super();
    // this.request = request;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_' && key[0] !== '$' && key !== 'metrics');

    for (const modelKey of models) {
      await this[modelKey].deleteMany({});
    }
  }
}
