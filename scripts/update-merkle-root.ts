import * as fs from 'fs'
import { BigNumber, utils } from 'ethers'
import {
  DEV_KETL_ATTESTATION_CONTRACT,
  KETL_BWL_NFT_CONTRACT,
  PROD_KETL_ATTESTATION_CONTRACT,
  YC_ALUM_NFT_CONTRACT,
} from '@big-whale-labs/constants'
import { KetlAttestation__factory } from '../typechain'
import { cwd } from 'process'
import { ethers } from 'hardhat'
import { resolve } from 'path'
import LineByLine from 'n-readlines'
import balanceVerification from '../utils/balanceVerification'
import emailVerification from '../utils/emailVerification'
import getMerkleTreeProof from '../utils/getMerkleTreeInputs'
import poseidonHash from '../utils/poseidonHash'
import prompt from 'prompt'
import tokenVerification from '../utils/tokenVerification'
import twitterVerification from '../utils/twitterVerification'

enum Verification {
  email = 'email',
  twitter = 'twitter',
  AlumNFT = 'AlumNFT',
  BWLNFT = 'BWLNFT',
  token = 'token',
}

function generateHashByRecord(
  str: string,
  hashFunc: (message: (number | string | BigNumber)[] | Uint8Array) => string
) {
  const [verification, content] = str.split(':')
  switch (verification) {
    case Verification.token:
      return tokenVerification(hashFunc, content)
    case Verification.email:
      return emailVerification(hashFunc, content)
    case Verification.twitter:
      return twitterVerification(hashFunc, content)
    case Verification.AlumNFT:
      return balanceVerification(hashFunc, content, YC_ALUM_NFT_CONTRACT)
    case Verification.BWLNFT:
      return balanceVerification(hashFunc, content, KETL_BWL_NFT_CONTRACT)
    default:
      throw new Error(`Unknown verification type: ${verification}!`)
  }
}

async function main() {
  const [deployer] = await ethers.getSigners()

  // Deploy the contract
  console.log('Updating contracts with the account:', deployer.address)
  console.log(
    'Account balance:',
    utils.formatEther(await deployer.getBalance())
  )

  const promptEnv = await prompt.get({
    properties: {
      isProduction: {
        type: 'boolean',
        required: true,
        default: false,
      },
    },
  })

  const { attestationAddress } = await prompt.get({
    properties: {
      attestationAddress: {
        required: true,
        default: promptEnv.isProduction
          ? PROD_KETL_ATTESTATION_CONTRACT
          : DEV_KETL_ATTESTATION_CONTRACT,
        conform: utils.isAddress,
      },
    },
  })

  const ketlAttestation = KetlAttestation__factory.connect(
    attestationAddress,
    deployer
  )

  const hashFunc = await poseidonHash()
  const ids = [0, 1, 2, 3]

  for (const id of ids) {
    const filePath = resolve(cwd(), 'merkleTrees', `${id}.txt`)
    const liner = new LineByLine(filePath)

    let line
    const attestationHashes = [] as string[]
    while ((line = liner.next())) {
      const record = line.toString('utf-8').trim()
      try {
        if (/^#/.test(record) || !record) continue
        const attestationHash = generateHashByRecord(record, hashFunc)
        if (attestationHash) attestationHashes.push(attestationHash)
      } catch (e) {
        console.error(e, record)
      }
    }

    fs.writeFileSync(
      resolve(cwd(), 'hashes', `${id}.json`),
      JSON.stringify(attestationHashes.sort()),
      'utf-8'
    )

    if (attestationHashes.length === 0) {
      console.log(`No records found for ${id}.txt`)
      continue
    }

    const merkleTreeProof = getMerkleTreeProof(
      20,
      hashFunc,
      attestationHashes[0],
      attestationHashes
    )

    const minimumEntanglementCounts =
      await ketlAttestation.minimumEntanglementCounts(id)

    const promptMinimumEntanglementCounts = await prompt.get({
      properties: {
        minimumEntanglementCounts: {
          type: 'number',
          required: true,
          default: minimumEntanglementCounts,
        },
      },
    })

    console.log(`Update merkleRoot with ${merkleTreeProof.root} for ${id}`)
    await ketlAttestation.setAttestationMerkleRoot(
      id,
      merkleTreeProof.root,
      promptMinimumEntanglementCounts.minimumEntanglementCounts
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
