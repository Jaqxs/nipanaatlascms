import { prisma } from './prisma';

export async function getDb() {
  return {
    mode: 'postgres',
    all: async (sql: string, params: any = []) => {
      try {
        const pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
        const rows: any[] = await prisma.$queryRawUnsafe(pgSql, ...params);
        return rows;
      } catch (err: any) {
        console.error(`[DB ERROR] SQL: ${sql} | Error: ${err.message}`);
        throw err;
      }
    },
    get: async (sql: string, params: any = []) => {
      try {
        const pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
        const rows: any[] = await prisma.$queryRawUnsafe(pgSql, ...params);
        return rows[0] || null;
      } catch (err: any) {
        console.error(`[DB ERROR] SQL: ${sql} | Error: ${err.message}`);
        throw err;
      }
    },
    run: async (sql: string, params: any = []) => {
      try {
        let pgSql = sql.replace(/INSERT OR REPLACE/gi, "INSERT");
        if (pgSql.toLowerCase().includes("settings")) {
           pgSql += " ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value";
        }
        pgSql = pgSql.replace(/\?/g, (_, i) => `$${i + 1}`);
        await prisma.$executeRawUnsafe(pgSql, ...params);
        return { lastID: Date.now() };
      } catch (err: any) {
        console.error(`[DB ERROR] SQL: ${sql} | Error: ${err.message}`);
        throw err;
      }
    },
    exec: async (sql: string) => {
      try {
        await prisma.$executeRawUnsafe(sql);
        return true;
      } catch (err: any) {
        console.error(`[DB ERROR] SQL: ${sql} | Error: ${err.message}`);
        throw err;
      }
    }
  };
}
