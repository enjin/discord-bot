import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util/u8a/toHexBuffer";
import config from "../config";
import { getRpcApi } from "@/util/rpc-client";

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
        metadata {
          name
        }
      }
      account{
        address
      }
      totalBalance
    }
  }
`;

const COLLECTION_ACCOUNT_COLLECTIONS_QUERY = `query collectionAccountsOfCollections($collections: [String!], $addresses: [String!]) {
    result: collectionAccounts(where: {collection: {id_in: $collections}, account:{ id_in: $addresses}}, orderBy: id_ASC) {
      collection{
        id
        metadata {
          name
        }
      }
      account{
        address
      }
      accountCount
    }
  }
`;

export async function makeIndexerRequest(body: string) {
	return fetch(config.indexerUrl!, {
		method: "POST",
		headers: new Headers({
			"Content-Type": "application/json",
			"CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID!,
			"CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET!
		}),
		body: body
	});
}

export async function getToken(id: string) {
	if (config.indexerUrl) {
		const res = await makeIndexerRequest(
			JSON.stringify({
				query: TOKEN_QUERY,
				variables: { id }
			})
		);

		const json = (await res.json()) as { data: { result: any | null } };

		return json.data.result;
	}
	const api = await getRpcApi();
	const [collectionId, tokenId] = id.split("-");

	const data = await api.query.multiTokens.tokens(collectionId, tokenId);

	return data.toPrimitive();
}

export async function getCollection(id: string) {
	if (config.indexerUrl) {
		const body = JSON.stringify({
			query: `query GetCollection($id: String!) {
                      result: collectionById(id: $id){
                        id
                        metadata { 
                          name
                        }
                      }
                    }`,
			variables: { id }
		});

		const res = await makeIndexerRequest(body);

		const json = (await res.json()) as { data: { result: any | null } };

		return json.data.result;
	}
	const api = await getRpcApi();
	const data = await api.query.multiTokens.collections(id);

	return data.toPrimitive();
}

export async function tokenAccountsOfTokens(tokens: string[], addresses: string[]) {
	if (config.indexerUrl) {
		const res = await makeIndexerRequest(
			JSON.stringify({
				query: TOKEN_ACCOUNT_TOKENS_QUERY,
				variables: {
					tokens,
					addresses: addresses.map((a) => u8aToHex(decodeAddress(a)))
				}
			})
		);

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

			result.push({
				totalBalance: Number(data.balance) + Number(data.reservedBalance),
				token: { id: token },
				account: { address: addresses[i] }
			});
		}
	}

	return result;
}

export async function collectionAccountsOfCollections(collections: string[], addresses: string[]) {
	if (config.indexerUrl) {
		const res = await makeIndexerRequest(
			JSON.stringify({
				query: COLLECTION_ACCOUNT_COLLECTIONS_QUERY,
				variables: {
					collections,
					addresses: addresses.map((a) => u8aToHex(decodeAddress(a)))
				}
			})
		);

		const json = (await res.json()) as { data: { result: any[] } };

		return json.data.result;
	}

	const api = await getRpcApi();
	const result = [];

	for (const collection of collections) {
		const res = await api.query.multiTokens.collectionAccounts.multi(addresses.map((a) => [collection, a]));
		for (let i = 0; i < res.length; i++) {
			const data = res[i].toPrimitive() as any;
			if (!data) continue;

			result.push({
				accountCount: Number(data.accountCount),
				collection: { id: collection },
				account: { address: addresses[i] }
			});
		}
	}

	return result;
}
