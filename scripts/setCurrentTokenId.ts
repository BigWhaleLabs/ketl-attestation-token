import { PROD_KETL_ATTESTATION_CONTRACT } from '@big-whale-labs/constants'
import { ethers } from 'hardhat'
import prompt from 'prompt'

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/

async function main() {
  const { isProduction } = await prompt.get({
    properties: {
      isProduction: { required: true, type: 'boolean', default: false },
    },
  })

  const { ketlAttestationContractAddress, currentTokenId } = await prompt.get({
    properties: {
      ketlAttestationContractAddress: {
        required: true,
        default: isProduction
          ? PROD_KETL_ATTESTATION_CONTRACT
          : '0x0c126daEe63509728704101FB2084ad0D98C2F12',
        pattern: ethereumAddressRegex,
      },
      currentTokenId: {
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
  const setCurrentTokenIdTx = await ketlAttestationContract.setCurrentTokenId(
    currentTokenId
  )
  await setCurrentTokenIdTx.wait()
  console.log('Set currentTokenId to ' + currentTokenId)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
