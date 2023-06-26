import { IncrementalMerkleTree } from '@zk-kit/incremental-merkle-tree'

export default function (
  depth: number,
  hashFunc: (values: string[]) => string | number | bigint | boolean,
  commitment: bigint | string,
  commitments: (bigint | string)[]
) {
  const tree = new IncrementalMerkleTree(
    (values) => BigInt(hashFunc(values)),
    depth,
    BigInt(0),
    2
  )

  commitments.forEach((c) => tree.insert(c))

  return tree.createProof(tree.indexOf(commitment))
}
