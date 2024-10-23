import { CronJob } from "cron";
import { expect } from "bun:test";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { client } from "@/bot";
import config from "./config";
import { getRpcApi } from "@/util/rpc-client";
import { makeIndexerRequest } from "@/util/api";
import manageUserRoles from "./util/manager";

async function checkIndexerHeight() {
	const api = await getRpcApi();
	const res = await makeIndexerRequest(
		JSON.stringify({
			query: `query {
             squidStatus {
                height
            }
        }`
		})
	);
	const json = (await res.json()) as { data: { squidStatus: { height: number } } };
	const indexerHeight = json.data.squidStatus.height;
	const height = await api.query.system.number();
	console.log(`Indexer height: ${indexerHeight}, Chain height: ${height.toPrimitive()}`);
	expect(Math.abs(indexerHeight - (height.toPrimitive() as unknown as number))).toBeLessThan(10);
}

async function handle() {
	if (config.indexerUrl) {
		await checkIndexerHeight();
	}

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
	start: true
});
