import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { client } from '@/bot';
import manageUserRoles from '../util/manager';

async function syncAllRoles() {
    console.log('Syncing all roles...');
    const servers = await db.select().from(schema.servers);
    for (const server of servers) {
        const connectedAccounts = await db
            .select()
            .from(schema.connectedAccounts)
            .where(eq(schema.connectedAccounts.serverId, server.id));

        for (const account of connectedAccounts) {
            await manageUserRoles(client, server.id, account.userId);
        }
    }

    console.log('All roles are synced!');
}

syncAllRoles();
