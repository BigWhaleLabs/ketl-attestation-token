import 'dotenv/config'
import * as fs from 'fs'
import { Alchemy, Network } from 'alchemy-sdk'
import { DEV_KETL_ATTESTATION_CONTRACT } from '@big-whale-labs/constants'
import { ethers } from 'ethers'
import KetlAttestationArtifact from '../artifacts/contracts/KetlAttestation.sol/KetlAttestation.json'

const gsnInterface = new ethers.utils.Interface([
  {
    inputs: [
      { internalType: 'string', name: 'domainSeparatorName', type: 'string' },
      {
        internalType: 'uint256',
        name: 'maxAcceptanceBudget',
        type: 'uint256',
      },
      {
        components: [
          {
            components: [
              { internalType: 'address', name: 'from', type: 'address' },
              { internalType: 'address', name: 'to', type: 'address' },
              { internalType: 'uint256', name: 'value', type: 'uint256' },
              { internalType: 'uint256', name: 'gas', type: 'uint256' },
              { internalType: 'uint256', name: 'nonce', type: 'uint256' },
              { internalType: 'bytes', name: 'data', type: 'bytes' },
              {
                internalType: 'uint256',
                name: 'validUntilTime',
                type: 'uint256',
              },
            ],
            internalType: 'struct IForwarder.ForwardRequest',
            name: 'request',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'maxFeePerGas',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'maxPriorityFeePerGas',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'transactionCalldataGasUsed',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'relayWorker',
                type: 'address',
              },
              { internalType: 'address', name: 'paymaster', type: 'address' },
              { internalType: 'address', name: 'forwarder', type: 'address' },
              { internalType: 'bytes', name: 'paymasterData', type: 'bytes' },
              { internalType: 'uint256', name: 'clientId', type: 'uint256' },
            ],
            internalType: 'struct GsnTypes.RelayData',
            name: 'relayData',
            type: 'tuple',
          },
        ],
        internalType: 'struct GsnTypes.RelayRequest',
        name: 'relayRequest',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
      { internalType: 'bytes', name: 'approvalData', type: 'bytes' },
    ],
    name: 'relayCall',
    outputs: [
      { internalType: 'bool', name: 'paymasterAccepted', type: 'bool' },
      { internalType: 'uint256', name: 'charge', type: 'uint256' },
      {
        internalType: 'enum IRelayHub.RelayCallStatus',
        name: 'status',
        type: 'uint8',
      },
      { internalType: 'bytes', name: 'returnValue', type: 'bytes' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
])

const ketlAttestationInterface = new ethers.utils.Interface(
  KetlAttestationArtifact.abi
)

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.MATIC_MUMBAI,
})

const ENTANGLEMENT_REGISTERED_TOPIC =
  '0x82ec2e6b77000a06458fdfa65b3d3b2d8b35e200fd1d335cebd1d6ef0c40fdf4'
const TRANSFER_SINGLE_TOPIC =
  '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62'
const DEV_CONTRACT_DEPLOYED_BLOCK = 36569615
const DEV_LEGACY_MINT_LOCKED_BLOCK = 36569648

async function main() {
  const logs = await alchemy.core.getLogs({
    fromBlock: DEV_LEGACY_MINT_LOCKED_BLOCK, // Legacy Mint Locked at Block 36569648
    address: DEV_KETL_ATTESTATION_CONTRACT,
    topics: [ENTANGLEMENT_REGISTERED_TOPIC],
  })

  const output: unknown[] = []
  for (const log of logs) {
    const tx = await alchemy.core.getTransaction(log.transactionHash)
    if (!tx) continue
    const gsnCalldata = gsnInterface.parseTransaction({ data: tx.data })
    const calldata = ketlAttestationInterface.parseTransaction({
      data: gsnCalldata.args.relayRequest.request.data,
    })
    const outputItem = {
      from: gsnCalldata.args.relayRequest.request.from,
      transactionHash: log.transactionHash,
      calldata: calldata.args,
    }
    output.push(outputItem)
  }

  fs.writeFileSync(
    'legacy/dev-register-entanglement.json',
    JSON.stringify(output)
  )
  //fs.writeFileSync('legacy/dev-set-nullifiers.json', JSON.stringify(output))
}

main().catch((error) => {
  console.error(error)
})
