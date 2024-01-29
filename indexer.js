require("dotenv").config();

const getAsset = async (address, collectionId) => {
  const res = await fetch(process.env.INDEXER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `qquery getCollectionTokenCount($collectionId: String!, $address: String!) {
        result: tokenAccountsConnection(where: {collection: {id_eq: $collectionId}, account: {id_eq: $address}}, orderBy: id_ASC) {
          totalCount
        }
      }`,
      variables: {
        collectionId,
        address,
      },
    }),
  });

  const data = await res.json();
  if (data.data.result.totalCount > 0) {
    return true;
  }

  return false;
};

module.exports = getAsset;
