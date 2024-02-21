import { ApiPromise, WsProvider } from "@polkadot/api";
import config from "@/config";

let client: ApiPromise;

export async function getRpcApi() {
  if (!client) {
    client = await ApiPromise.create({
      provider: new WsProvider(config.rpcUrl, 2000)
    });
  }

  return client;
}
