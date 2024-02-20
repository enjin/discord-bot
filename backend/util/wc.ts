import { SignClient } from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";
import config from "../config";
import { signatureVerify } from "@polkadot/util-crypto";
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

  const canvas = new Canvas(500, 500);
  const context = canvas.getContext("2d");
  const qr = await QR.toDataURL(uri as string);
  context.drawImage(await loadImage(qr), 0, 0, 500, 500);
  const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: "connect-wallet-enjin.png" });

  return { uri, approval, verifyAddress: verifyAddress(client), attachment };
};

export const verifyAddress = (client: Awaited<ReturnType<typeof getClient>>) => {
  return async (address: string, session: SessionTypes.Struct) => {
    const message = `Please confirm your address ${address} by signing this message.`;
    
    const result = await client!.request<{ signature: string }>({
      chainId: config.wcNamespace,
      topic: session.topic,
      request: {
        method: "polkadot_signMessage",
        params: {
          address: address,
          message
        }
      },
      expiry: 300
    });

    if (result.signature) {
      return signatureVerify(message, result.signature, address).isValid;
    }

    return false;
  };
};

export const getClient = async () => {
  const client = await initWC2ClientPromise;

  return client;
};
