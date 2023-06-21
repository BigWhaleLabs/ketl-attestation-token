import { BigNumber } from 'ethers'
import { buildPoseidon } from 'circomlibjs'

export default async function () {
  const poseidon = await buildPoseidon()
  const F = poseidon.F

  return (message: (number | string | BigNumber)[] | Uint8Array) =>
    F.toString(poseidon(message))
}
