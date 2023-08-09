import {
  DEV_KETL_ATTESTATION_CONTRACT,
  PROD_KETL_ATTESTATION_CONTRACT,
} from '@big-whale-labs/constants'
import { ethers } from 'hardhat'
import prompt from 'prompt'

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/

async function main() {
  const { isProduction } = await prompt.get({
    properties: {
      isProduction: { required: true, type: 'boolean', default: false },
    },
  })

  const {
    ketlAttestationContractAddress,
    attestationType,
    maxEntanglementsPerAttestationType,
  } = await prompt.get({
    properties: {
      ketlAttestationContractAddress: {
        required: true,
        default: isProduction
          ? PROD_KETL_ATTESTATION_CONTRACT
          : DEV_KETL_ATTESTATION_CONTRACT,
        pattern: ethereumAddressRegex,
      },
      attestationType: {
        type: 'number',
        require: true,
        default: 1,
      },
      maxEntanglementsPerAttestationType: {
        type: 'number',
        require: true,
        default: 3,
      },
    },
  })

  const ketlAttestationContract = await ethers.getContractAt(
    'KetlAttestation',
    ketlAttestationContractAddress
  )
  const setMaxEntanglementsTx =
    await ketlAttestationContract.setMaxEntanglementsPerAttestationType(
      attestationType,
      maxEntanglementsPerAttestationType
    )
  await setMaxEntanglementsTx.wait()
  console.log(
    `Set maxEntanglementsPerAttestationType for attestationType ${attestationType} to ${maxEntanglementsPerAttestationType}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
