import { HashFunction } from './poseidonHash'
import { utils } from 'ethers'
import VerificationType from './VerificationType'
import hexlifyString from './hexlifyString'

export default function (hash: HashFunction, ownerAddress: string, nftAddress) {
  if (!utils.isAddress(ownerAddress) || !utils.isAddress(nftAddress))
    throw new Error(`Invalid ethereum address: ${ownerAddress}!`)
  return hash([
    VerificationType.balance,
    hexlifyString(ownerAddress.toLowerCase()),
    1,
    hexlifyString(nftAddress),
  ])
}
