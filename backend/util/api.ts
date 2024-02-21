import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util/u8a/toHexBuffer";
import config from "../config";
import { getRpcApi } from "@/util/rpc-client";
import { isNonNull } from "remeda";

const TOKEN_QUERY = `query GetToken($id: String!) {
    result: tokenById(id: $id){
      id
      metadata { 
        name
    }
    }
  }  
`;

const TOKEN_ACCOUNT_TOKENS_QUERY = `query tokenAccountsOfTokens($tokens: [String!], $addresses: [String!]) {
    result: tokenAccounts(where: {token: {id_in: $tokens}, account:{ id_in: $addresses}}, orderBy: id_ASC) {
      token{
        id
      }
      account{
        address
      }
      totalBalance
    }
  }
`;

export async function getToken(id: string) {
  if (config.indexerUrl) {
    const res = await fetch(config.indexerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: TOKEN_QUERY,
        variables: { id }
      })
    });

    const json = (await res.json()) as { data: { result: any | null } };

    return json.data.result;
  }
  const api = await getRpcApi();
  const [collectionId, tokenId] = id.split("-");

  const data = await api.query.multiTokens.tokens(collectionId, tokenId);

  return data.toPrimitive();
}

export async function tokenAccountsOfTokens(tokens: string[], addresses: string[]) {
  if (config.indexerUrl) {
    const res = await fetch(config.indexerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: TOKEN_ACCOUNT_TOKENS_QUERY,
        variables: { tokens, addresses: addresses.map((a) => u8aToHex(decodeAddress(a))) }
      })
    });

    const json = (await res.json()) as { data: { result: any[] } };

    return json.data.result;
  }

  const api = await getRpcApi();
  const result = [];

  for (const token of tokens) {
    const [collectionId, tokenId] = token.split("-");

    const res = await api.query.multiTokens.tokenAccounts.multi(addresses.map((a) => [collectionId, tokenId, a]));
    for (let i = 0; i < res.length; i++) {
      const data = res[i].toPrimitive() as any;
      if (!data) continue;

      result.push({ totalBalance: Number(data.balance) + Number(data.reservedBalance), token: { id: token }, account: { address: addresses[i] } });
    }
  }

  return result;
}
