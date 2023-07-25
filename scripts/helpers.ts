import { KetlAttestation, KetlAttestation__factory } from '../typechain'
import { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'

const KetlAttestationInterface = new ethers.utils.Interface(
  KetlAttestation__factory.abi
)

const GSNInterface = new ethers.utils.Interface([
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

// eslint-disable-next-line import/prefer-default-export
export async function getLegacyTokenHolders(
  address: string,
  provider: Provider,
  startBlock: Parameters<KetlAttestation['queryFilter']>[1] = 0,
  endBlock: Parameters<KetlAttestation['queryFilter']>[2] = 'latest'
) {
  const addresses: string[] = []
  const attestationTypes: number[] = []
  const contract = await KetlAttestation__factory.connect(address, provider)
  const logs = await contract.queryFilter(
    contract.filters.TransferSingle(),
    startBlock,
    endBlock
  )
  for (const log of logs) {
    const logDescription = KetlAttestationInterface.parseLog(log)
    addresses.push(logDescription.args[2]) // TransferSingle.to
    attestationTypes.push(logDescription.args[3]) // TransferSingle.id
  }
  return [addresses, attestationTypes] as const
}

export async function getLegacyRegisterEntanglementCalldata(
  address: string,
  provider: Provider,
  startBlock: Parameters<KetlAttestation['queryFilter']>[1] = 0,
  endBlock: Parameters<KetlAttestation['queryFilter']>[2] = 'latest'
) {
  const contract = await KetlAttestation__factory.connect(address, provider)
  const logs = await contract.queryFilter(
    contract.filters.EntanglementRegistered(),
    startBlock,
    endBlock
  )
  const output: {
    a: Parameters<KetlAttestation['registerEntanglement']>[0]
    b: Parameters<KetlAttestation['registerEntanglement']>[1]
    c: Parameters<KetlAttestation['registerEntanglement']>[2]
    inputs: Parameters<KetlAttestation['registerEntanglement']>[3]
  }[] = []
  for (const log of logs) {
    const tx = await provider.getTransaction(log.transactionHash)
    if (tx.data.substring(0, 10) !== '0x6ca862e2') continue // Continue if not GSN relayCall
    const gsnCalldata = GSNInterface.parseTransaction({ data: tx.data })
    const calldata = KetlAttestationInterface.parseTransaction({
      data: gsnCalldata.args.relayRequest.request.data,
    })
    output.push({
      a: calldata.args.a,
      b: calldata.args.b,
      c: calldata.args.c,
      inputs: calldata.args.input,
    })
  }
  return output
}

export async function getLegacyMintCalldata(
  address: string,
  provider: Provider,
  startBlock: Parameters<KetlAttestation['queryFilter']>[1] = 0,
  endBlock: Parameters<KetlAttestation['queryFilter']>[2] = 'latest'
) {
  const contract = await KetlAttestation__factory.connect(address, provider)
  const logs = await contract.queryFilter(
    contract.filters.TransferSingle(),
    startBlock,
    endBlock
  )
  const output: {
    a: Parameters<KetlAttestation['mint']>[0]
    b: Parameters<KetlAttestation['mint']>[1]
    c: Parameters<KetlAttestation['mint']>[2]
    inputs: Parameters<KetlAttestation['mint']>[3]
  }[] = []
  for (const log of logs) {
    const tx = await provider.getTransaction(log.transactionHash)
    if (tx.data.substring(0, 10) !== '0x6ca862e2') continue // Continue if not GSN relayCall
    const gsnCalldata = GSNInterface.parseTransaction({ data: tx.data })
    const calldata = KetlAttestationInterface.parseTransaction({
      data: gsnCalldata.args.relayRequest.request.data,
    })
    output.push({
      a: calldata.args.a,
      b: calldata.args.b,
      c: calldata.args.c,
      inputs: calldata.args.input,
    })
  }
  return output
}
