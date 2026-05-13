import { prisma } from './prisma';

export async function getDb() {
  return {
    mode: 'postgres',
    // Prisma already handles table creation via migrations, 
    // but we can ensure it's connected
    all: async (sql: string, params: any = []) => {
      // Direct raw query fallback for existing code
      if (sql.toLowerCase().includes('select')) {
        const table = sql.match(/from\s+(\w+)/i)?.[1];
        if (table === 'inventory') return await prisma.inventory.findMany({ orderBy: { id: 'desc' } });
        if (table === 'transactions') return await prisma.transaction.findMany({ orderBy: { date: 'desc' } });
        if (table === 'sites') return await prisma.site.findMany();
        if (table === 'contacts') return await prisma.contact.findMany();
        if (table === 'settings') return await prisma.setting.findMany();
      }
      return [];
    },
    get: async (sql: string, params: any = []) => {
      if (sql.toLowerCase().includes('settings')) {
        const key = params[0];
        return await prisma.setting.findUnique({ where: { key } });
      }
      return null;
    },
    run: async (sql: string, params: any = []) => {
      // This is a simplified mapper. In a real Prisma app, 
      // we'd refactor the API routes to use prisma directly.
      if (sql.toLowerCase().includes('insert into inventory')) {
        await prisma.inventory.create({
          data: {
            id: params[0],
            batch: params[1],
            weight: params[2],
            karat: params[3],
            fine: params[4],
            location: params[5],
            status: params[6],
            value: params[7],
            source: params[8]
          }
        });
      }
      if (sql.toLowerCase().includes('update inventory')) {
         // simplified status update
         await prisma.inventory.update({
           where: { id: params[1] },
           data: { status: params[0] }
         });
      }
      return { lastID: Date.now() };
    },
    exec: async (sql: string) => {
      return true;
    }
  };
}
