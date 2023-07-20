import { KetlAttestation, KetlAttestation__factory } from '../typechain'
import { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'

const KetlAttestationInterface = new ethers.utils.Interface(
  KetlAttestation__factory.abi
)

// eslint-disable-next-line import/prefer-default-export
export async function getLegacyTokenHolders(
  address: string,
  provider: Provider,
  startBlock: Parameters<KetlAttestation['queryFilter']>[1] = 0,
  endBlock: Parameters<KetlAttestation['queryFilter']>[2] = 'latest'
) {
  const addresses: string[] = []
  const attestationTypes: number[] = []
  const contract = await KetlAttestation__factory.connect(address, provider)
  const logs = await contract.queryFilter(
    contract.filters.TransferSingle(),
    startBlock,
    endBlock
  )
  for (const log of logs) {
    const logDescription = KetlAttestationInterface.parseLog(log)
    addresses.push(logDescription.args[2]) // TransferSingle.to
    attestationTypes.push(logDescription.args[3]) // TransferSingle.id
  }
  return [addresses, attestationTypes] as const
}
