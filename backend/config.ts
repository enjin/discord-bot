import z from "zod";

const envSchema = z.object({
  botToken: z.string(),
  indexerUrl: z.string().url().trim().optional(),
  clientId: z.string(),
  wcNamespace: z.string().trim().default("polkadot:3af4ff48ec76d2efc8476730f423ac07"),
  dbUrl: z.string(),
  rpcUrl: z.string().url().trim()
});


export default envSchema.parse({
  botToken: process.env.DISCORD_BOT_TOKEN,
  indexerUrl: process.env.INDEXER_URL,
  clientId: process.env.DISCORD_APPLICATION_ID,
  wcNamespace: process.env.WC_NAMESPACE,
  rpcUrl: process.env.RPC_URL,
  dbUrl: process.env.DB_URL
});
