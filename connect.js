const getAsset = require("./indexer");
const { SignClient } = require("@walletconnect/sign-client");
const { getAppMetadata, getSdkError } = require("@walletconnect/utils");

const initWC2Client = async () => {
  return SignClient.init({
    projectId: process.env.WALLET_CONNECT_PROJECT_ID,
    metadata: getAppMetadata(),
  });
};

const connectUser = async (user, guild, config) => {
  const clientPromise = initWC2Client();
  const signClient = await clientPromise;

  const { uri, approval } = await signClient.connect({
    requiredNamespaces: {
      polkadot: {
        methods: [],
        chains: [process.env.WC_NAMESPACE],
        events: [],
      },
    },
  });

  const attachment = await generateCanvas(uri);

  user.send({
    content: "Scan the QR code with your Enjin wallet:",
    files: [attachment],
  });

  let session;
  try {
    session = await approval();
    const token = await checkWallet(session);
    if (token) {
      await grantRole(guild.members.cache.get(user.id), config);
      user.send("You are all set! Welcome to the club!");
    } else {
      user.send(
        "You do not own the token..Please make sure you own it and try again."
      );
    }
  } catch (e) {
    user.send("Failed to connect to wallet");
  } finally {
    if (session) {
      signClient.disconnect({
        topic: session.topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
    }
  }
};

const checkWallet = async (session) => {
  const addresses = Object.values(session.namespaces)
    .map((namespace) => namespace.accounts)
    .flat()
    .filter((account) => {
      const [namespace, chainHash] = account.split(":");

      return `${namespace}:${chainHash}` === process.env.WC_NAMESPACE;
    })
    .map((account) => {
      const [, , address] = account.split(":");

      return address;
    });

  return await checkToken(addresses);
};

const checkToken = async (addresses) => {
  for (let index = 0; index < array.length; index++) {
    if (await getAsset(addresses[index], "24123")) {
      return true;
    }
  }
  return false;
};

const grantRole = async (user, config) => {
  await user.roles.add(config.roleId);
};

module.exports = {
  initWC2Client,
  checkWallet,
  connectUser,
};
