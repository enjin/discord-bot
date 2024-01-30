import z from "zod";

const envSchema = z.object({
  botToken: z.string(),
  indexerUrl: z.string().url().trim(),
  clientId: z.string(),
  wcNamespace: z.string(),
  guildId: z.string().optional(),
  dbUrl: z.string()
});


export default envSchema.parse({
  botToken: process.env.BOT_TOKEN,
  indexerUrl: process.env.INDEXER_URL,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  wcNamespace: process.env.WC_NAMESPACE,
  dbUrl: process.env.DB_URL
});
