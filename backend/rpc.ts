import config from "@/config";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import manageUserRoles from "@/util/manager";
import { client } from "@/bot";
import { getRpcApi } from "@/util/rpc-client";

async function dispatchToManager(address: string) {
  if (config.indexerUrl) {
    // delay for 30 seconds.
    // This is to ensure that the indexer has indexed the transaction before we query the database.
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
  const accounts = await db.select().from(schema.accountAddress).where(eq(schema.accountAddress.address, address));

  for (const account of accounts) {
    const [serverId, memberId] = account.memberId.split("-");
    manageUserRoles(client, serverId, memberId);
  }
}

async function main() {
  const api = await getRpcApi();

  api.query.system.events((events: any[]) => {
    events.forEach((record) => {
      const { event } = record;

      if (event.section === "multiTokens" && event.method === "Transferred") {
        dispatchToManager(event.data[3].toString());
        dispatchToManager(event.data[4].toString());
      }

      if (event.section === "multiTokens" && event.method === "Minted") {
        dispatchToManager(event.data[3].toString());
      }
    });
  });

  console.log("listening to rpc events...");
}

main().catch((error) => {
  console.error("rpc-error", error);
});
