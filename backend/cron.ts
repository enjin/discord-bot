import { CronJob } from "cron";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { client } from "@/bot";
import manageUserRoles from "./util/manager";

async function handle() {
  const servers = await db.select().from(schema.servers);
  for (const server of servers) {
    const connectedAccounts = await db.select().from(schema.connectedAccounts).where(eq(schema.connectedAccounts.serverId, server.id));
    for (const account of connectedAccounts) {
      await manageUserRoles(client, server.id, account.userId);
    }
  }
}

// This is a fail safe, in ideal case, the rpc event will evaluate accounts in real time.
CronJob.from({
  cronTime: "0 0 * * *", // every day at midnight
  onTick: function () {
    handle();
  },
  utcOffset: 0,
  start: true // you can disable this by setting to false
});
