import * as fs from 'fs'
import {
  DEV_KETL_ATTESTATION_CONTRACT,
  PROD_KETL_ATTESTATION_CONTRACT,
} from '@big-whale-labs/constants'
import { ethers } from 'hardhat'
import { getLegacyMintCalldata } from './helpers'

async function main() {
  const provider = ethers.provider

  const devCalldata = await getLegacyMintCalldata(
    DEV_KETL_ATTESTATION_CONTRACT,
    provider
  )
  fs.writeFileSync('legacy/dev-mint.json', JSON.stringify(devCalldata))

  const prodCalldata = await getLegacyMintCalldata(
    PROD_KETL_ATTESTATION_CONTRACT,
    provider
  )
  fs.writeFileSync('legacy/prod-mint.json', JSON.stringify(prodCalldata))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
