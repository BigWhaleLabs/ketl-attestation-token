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

  const { ketlAttestationContractAddress } = await prompt.get({
    properties: {
      ketlAttestationContractAddress: {
        required: true,
        default: isProduction
          ? PROD_KETL_ATTESTATION_CONTRACT
          : '0x0c126daEe63509728704101FB2084ad0D98C2F12',
        pattern: ethereumAddressRegex,
      },
    },
  })

  const ketlAttestationContract = await ethers.getContractAt(
    'KetlAttestation',
    ketlAttestationContractAddress
  )
  const setCurrentTokenIdTx =
    await ketlAttestationContract.setAttestationMerkleRoot(
      2,
      '8714337466748653803179957663724376420469730618592500824396233556950730762755',
      3
    )
  await setCurrentTokenIdTx.wait()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
