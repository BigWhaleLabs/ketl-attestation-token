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
import { readdirSync, writeFileSync } from 'fs'
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
  orangedao = 'orangedao',
  bwlnft = 'bwlnft',
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
    case Verification.orangedao:
      return balanceVerification(hashFunc, content, YC_ALUM_NFT_CONTRACT)
    case Verification.bwlnft:
      return balanceVerification(hashFunc, content, KETL_BWL_NFT_CONTRACT)
    default:
      throw new Error(`Unknown verification type: ${verification}!`)
  }
}

async function main() {
  // Get the wallet to update the contract with
  const [deployer] = await ethers.getSigners()
  // Log the deployer details
  console.log('Updating contracts with the account:', deployer.address)
  console.log(
    'Account balance:',
    utils.formatEther(await deployer.getBalance())
  )

  // Define the list of contracts
  const contractAddresses = [
    PROD_KETL_ATTESTATION_CONTRACT,
    DEV_KETL_ATTESTATION_CONTRACT,
  ]

  // Create hash function
  const hashFunc = await poseidonHash()

  // Read merkleTrees folder
  const ids = readdirSync(resolve(cwd(), 'merkleTrees'))
    .filter((n) => n.includes('.txt'))
    .map((n) => +n.replace('.txt', ''))
  if (!ids.length) {
    console.log('No merkleTrees found!')
    return
  }

  // Choose what ids to update
  const { promptIds } = await prompt.get({
    properties: {
      promptIds: {
        type: 'string',
        required: true,
        default: ids.join(','),
        description: 'Ids to update split by ","',
      },
    },
  })

  // Update the ids
  for (const id of promptIds.split(',')) {
    console.log(`Updating merkleRoot for ${id}`)
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

    console.log(`Found ${attestationHashes.length} records for ${id}`)

    writeFileSync(
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

    const { proceed } = await prompt.get({
      properties: {
        proceed: {
          type: 'boolean',
          required: true,
          default: true,
          description: `⚠️ Last chance to abort! We're updating ${id} on both production and development with merkleRoot ${merkleTreeProof.root} and ${attestationHashes.length} records. Continue?`,
        },
      },
    })
    if (!proceed) {
      console.log('Aborting!')
      return
    }

    for (const address of contractAddresses) {
      const ketlAttestation = KetlAttestation__factory.connect(
        address,
        deployer
      )

      const minimumEntanglementCounts =
        await ketlAttestation.minimumEntanglementCounts(id)

      const promptMinimumEntanglementCounts = await prompt.get({
        properties: {
          minimumEntanglementCounts: {
            type: 'number',
            required: true,
            default: minimumEntanglementCounts,
            description: 'Minimum entanglement counts',
          },
        },
      })

      console.log(
        `Updating merkleRoot to ${merkleTreeProof.root} for ${id} on contract ${address}`
      )
      await ketlAttestation.setAttestationMerkleRoot(
        id,
        merkleTreeProof.root,
        promptMinimumEntanglementCounts.minimumEntanglementCounts
      )
      console.log(
        `Updated merkleRoot to ${merkleTreeProof.root} for ${id} on contract ${address}`
      )
    }
  }
  console.log('Done!')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
