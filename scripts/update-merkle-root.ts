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
import getMerkleTreeProof from '../utils/getMerkleTreeInputs'
import lineByLine from 'n-readlines'
import poseidonHash from '../utils/poseidonHash'
import prompt from 'prompt'

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/

function hexlifyString(str: string) {
  return utils.hexlify(utils.toUtf8Bytes(str))
}

enum Verification {
  email = 'email',
  twitter = 'twitter',
  AlumNFT = 'AlumNFT',
  BWLNFT = 'BWLNFT',
  token = 'token',
}

enum VerificationType {
  email = '0',
  twitter = '1',
  balance = '2',
  token = '3',
}

function generateHashByRecord(
  str: string,
  hashFunc: (message: (number | string | BigNumber)[] | Uint8Array) => string
) {
  const [verification, content] = str.split(':')
  switch (verification) {
    case Verification.token:
      if (isNaN(parseInt(content, 10)))
        throw new Error(`Invalid number: ${content}!`)
      return hashFunc([hexlifyString(content)])
    case Verification.email:
      return hashFunc([VerificationType.email, hexlifyString(content)])
    case Verification.twitter:
      if (isNaN(parseInt(content, 10)))
        throw new Error(`Invalid number: ${content}!`)
      return hashFunc([VerificationType.twitter, parseInt(content, 10)])
    case Verification.AlumNFT:
      if (!ethereumAddressRegex.test(content.toLowerCase()))
        throw new Error(`Invalid ethereum address: ${content}!`)
      return hashFunc([
        VerificationType.balance,
        hexlifyString(content.toLowerCase()),
        1,
        hexlifyString(YC_ALUM_NFT_CONTRACT),
      ])
    case Verification.BWLNFT:
      if (!ethereumAddressRegex.test(content.toLowerCase()))
        throw new Error(`Invalid ethereum address: ${content}!`)
      return hashFunc([
        VerificationType.balance,
        hexlifyString(content.toLowerCase()),
        1,
        hexlifyString(KETL_BWL_NFT_CONTRACT),
      ])
    default:
      throw new Error(`Unknow verification type: ${verification}, str: ${str}!`)
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

  const promptResult = await prompt.get({
    properties: {
      attestationAddress: {
        required: true,
        default: promptEnv.isProduction
          ? PROD_KETL_ATTESTATION_CONTRACT
          : DEV_KETL_ATTESTATION_CONTRACT,
        pattern: ethereumAddressRegex,
      },
    },
  })

  const { attestationAddress } = promptResult

  console.log(`Updating contract: ${attestationAddress}`)
  const ketlAttestation = KetlAttestation__factory.connect(
    attestationAddress,
    deployer
  )

  const hashFunc = await poseidonHash()
  const ids = [0, 1, 2, 3]

  for (const id of ids) {
    const filePath = resolve(cwd(), 'merkleTrees', `${id}.txt`)
    const liner = new lineByLine(filePath)

    let line
    const attestationHashes = [] as string[]
    while ((line = liner.next())) {
      const record = line.toString('utf-8')
      try {
        const attestationHash = generateHashByRecord(record, hashFunc)
        attestationHashes.push(attestationHash)
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

    const merkeTreeProof = getMerkleTreeProof(
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

    console.log(`Update merkleRoot with ${merkeTreeProof.root} for ${id}`)
    await ketlAttestation.setAttestationMerkleRoot(
      id,
      merkeTreeProof.root,
      promptMinimumEntanglementCounts.minimumEntanglementCounts
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
