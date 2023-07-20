import * as fs from 'fs'
import {
  DEV_KETL_ATTESTATION_CONTRACT,
  PROD_KETL_ATTESTATION_CONTRACT,
} from '@big-whale-labs/constants'
import { ethers } from 'hardhat'
import { getLegacyTokenHolders } from './helpers'

async function main() {
  const provider = ethers.provider

  const [holdersDev, attestationTypesDev] = await getLegacyTokenHolders(
    DEV_KETL_ATTESTATION_CONTRACT,
    provider
  )
  const outputDev = {
    count: holdersDev.length,
    holders: holdersDev,
    attestationTypes: attestationTypesDev,
  }
  fs.writeFileSync('legacy/dev-token-holders.json', JSON.stringify(outputDev))

  const [holdersProd, attestationTypesProd] = await getLegacyTokenHolders(
    PROD_KETL_ATTESTATION_CONTRACT,
    provider
  )
  const outputProd = {
    count: holdersProd.length,
    holders: holdersProd,
    attestationTypes: attestationTypesProd,
  }
  fs.writeFileSync('legacy/prod-token-holders.json', JSON.stringify(outputProd))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
