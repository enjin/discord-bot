import config from "../config";

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
    result: tokenAccounts(where: {token: {id_in: $tokens}, account:{ address_in: $addresses}}, orderBy: id_ASC) {
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

export async function tokenAccountsOfTokens(tokens: string[], addresses: string[]) {
  const res = await fetch(config.indexerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: TOKEN_ACCOUNT_TOKENS_QUERY,
      variables: { tokens, addresses }
    })
  });

  const json = (await res.json()) as { data: { result: any[] } };

  return json.data.result;
}
