import { prisma } from './prisma';

export async function getDb() {
  return {
    mode: 'postgres',
    // Prisma already handles table creation via migrations, 
    // but we can ensure it's connected
    all: async (sql: string, params: any = []) => {
      let pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
      return await prisma.$queryRawUnsafe(pgSql, ...params);
    },
    get: async (sql: string, params: any = []) => {
      let pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
      const rows: any[] = await prisma.$queryRawUnsafe(pgSql, ...params);
      return rows[0] || null;
    },
    run: async (sql: string, params: any = []) => {
      let pgSql = sql.replace(/INSERT OR REPLACE/gi, "INSERT");
      if (pgSql.toLowerCase().includes("settings")) {
         pgSql += " ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value";
      }
      pgSql = pgSql.replace(/\?/g, (_, i) => `$${i + 1}`);
      await prisma.$executeRawUnsafe(pgSql, ...params);
      return { lastID: Date.now() };
    },
    exec: async (sql: string) => {
      await prisma.$executeRawUnsafe(sql);
      return true;
    }
  };
}
