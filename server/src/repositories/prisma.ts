import { PrismaClient } from '@prisma/client';
import { env } from '@/config/env';

// Create and export a single Prisma client instance
const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down database connection...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default prisma;

// Base repository class
export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Generic CRUD operations
  async findById(_id: string): Promise<T | null> {
    throw new Error('findById must be implemented by subclass');
  }

  async findMany(_params?: any): Promise<T[]> {
    throw new Error('findMany must be implemented by subclass');
  }

  async create(_data: any): Promise<T> {
    throw new Error('create must be implemented by subclass');
  }

  async update(_id: string, _data: any): Promise<T> {
    throw new Error('update must be implemented by subclass');
  }

  async delete(_id: string): Promise<T> {
    throw new Error('delete must be implemented by subclass');
  }

  async count(_params?: any): Promise<number> {
    throw new Error('count must be implemented by subclass');
  }
}
