import { SignClient } from "@walletconnect/sign-client";
import config from "../config";
import { Canvas, loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder } from "discord.js";
import QR from "qrcode";

const initWC2Client = async () => {
  return SignClient.init({
    projectId: process.env.WALLET_CONNECT_PROJECT_ID,
    metadata: {
      name: "Enjin Bot",
      description: "Enjin Discord Bot",
      url: "https://enjin.io",
      icons: ["https://enjin.io/favicon.ico"]
    }
  });
};

const initWC2ClientPromise = initWC2Client();

export const connectToWC = async () => {
  const client = await getClient();
  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      polkadot: {
        methods: ["polkadot_signMessage"],
        chains: [config.wcNamespace],
        events: []
      }
    }
  });

  const canvas = new Canvas(500, 500)
  const context = canvas.getContext("2d");
  const qr = await QR.toDataURL(uri as string);
  context.drawImage(await loadImage(qr), 0, 0, 500, 500);
  const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: "connect-wallet-enjin.png" });

  return { uri, approval, attachment };
};

export const getClient = async () => {
  const client = await initWC2ClientPromise;

  return client;
}
