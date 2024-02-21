import { ApiPromise, WsProvider } from "@polkadot/api";
import config from "@/config";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import manageUserRoles from "@/util/manager";
import { client } from "@/bot";

async function dispatchToManager(address: string) {
  const accounts = await db.select().from(schema.accountAddress).where(eq(schema.accountAddress.address, address));

  for (const account of accounts) {
    const [serverId, memberId] = account.memberId.split("-");
    manageUserRoles(client, serverId, memberId);
  }
}

async function main() {
  const api = await ApiPromise.create({
    provider: new WsProvider(config.rpcUrl)
  });

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
