import { EmptyTupleInsertionError } from './errors.js';
import { TripleRow, TripleStoreTransaction } from './triple-store.js';
import { objectToTuples } from './utils.js';

// TODO: delete, this is deprecated
export async function insert(
  store: TripleStoreTransaction,
  id: string,
  document: Record<string, any>,
  collectionName?: string
) {
  const timestamp = await store.getTransactionTimestamp();
  const extendedTuples = objectToTuples(document);

  const avRows = extendedTuples.map((pathVal) => {
    if (pathVal.length === 0)
      throw new EmptyTupleInsertionError(id, document, collectionName);
    return {
      attribute: [
        ...(collectionName ? [collectionName] : []),
        ...(pathVal.slice(0, -1) as string[]),
      ],
      value: pathVal.at(-1) as string | number | null,
    };
  });
  const triples: TripleRow[] = avRows.map<TripleRow>(
    ({ attribute, value }) => ({
      id,
      attribute,
      value,
      timestamp,
      expired: false,
    })
  );

  if (collectionName) {
    triples.push({
      id,
      attribute: ['_collection'],
      value: collectionName,
      timestamp,
      expired: false,
    });
  }
  await store.insertTriples(triples);
}
