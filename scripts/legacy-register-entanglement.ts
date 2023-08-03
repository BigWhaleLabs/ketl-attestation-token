import * as fs from 'fs'
import {
  DEV_KETL_ATTESTATION_CONTRACT,
  PROD_KETL_ATTESTATION_CONTRACT,
} from '@big-whale-labs/constants'
import { ethers } from 'hardhat'
import { getLegacyRegisterEntanglementCalldata } from './helpers'

async function main() {
  const provider = ethers.provider
  const devFile = 'legacy/dev-register-entanglements.json'
  const devCalldata = await getLegacyRegisterEntanglementCalldata(
    DEV_KETL_ATTESTATION_CONTRACT,
    provider
  )
  fs.writeFileSync(devFile, JSON.stringify(devCalldata))

  const prodFile = 'legacy/prod-register-entanglements.json'
  const prodCalldata = await getLegacyRegisterEntanglementCalldata(
    PROD_KETL_ATTESTATION_CONTRACT,
    provider
  )
  fs.writeFileSync(prodFile, JSON.stringify(prodCalldata))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
