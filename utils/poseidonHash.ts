import { BigNumber } from 'ethers'
import { buildPoseidon } from 'circomlibjs'

export type HashFunction = (
  message: (number | string | BigNumber)[] | Uint8Array
) => string

export default async function (): Promise<HashFunction> {
  const poseidon = await buildPoseidon()
  const F = poseidon.F

  return (message) => F.toString(poseidon(message))
}
