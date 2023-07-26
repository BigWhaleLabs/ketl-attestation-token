import { GSN_MUMBAI_PAYMASTER_CONTRACT_ADDRESS } from '@big-whale-labs/constants'
import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  const PaymasterInterface = new ethers.utils.Interface([
    {
      inputs: [
        { internalType: 'address[]', name: '_targets', type: 'address[]' },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'target',
          type: 'address',
        },
      ],
      name: 'TargetAdded',
      type: 'event',
    },
    {
      inputs: [],
      name: 'CALLDATA_SIZE_LIMIT',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'FORWARDER_HUB_OVERHEAD',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'PAYMASTER_ACCEPTANCE_BUDGET',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'POST_RELAYED_CALL_GAS_LIMIT',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'PRE_RELAYED_CALL_GAS_LIMIT',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address[]', name: '_targets', type: 'address[]' },
      ],
      name: 'addTargets',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getGasAndDataLimits',
      outputs: [
        {
          components: [
            {
              internalType: 'uint256',
              name: 'acceptanceBudget',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'preRelayedCallGasLimit',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'postRelayedCallGasLimit',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'calldataSizeLimit',
              type: 'uint256',
            },
          ],
          internalType: 'struct IPaymaster.GasAndDataLimits',
          name: 'limits',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getRelayHub',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getTrustedForwarder',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'bytes', name: 'context', type: 'bytes' },
        { internalType: 'bool', name: 'success', type: 'bool' },
        {
          internalType: 'uint256',
          name: 'gasUseWithoutPost',
          type: 'uint256',
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
            { internalType: 'address', name: 'relayWorker', type: 'address' },
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
      name: 'postRelayedCall',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
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
                {
                  internalType: 'address',
                  name: 'paymaster',
                  type: 'address',
                },
                {
                  internalType: 'address',
                  name: 'forwarder',
                  type: 'address',
                },
                {
                  internalType: 'bytes',
                  name: 'paymasterData',
                  type: 'bytes',
                },
                {
                  internalType: 'uint256',
                  name: 'clientId',
                  type: 'uint256',
                },
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
        { internalType: 'uint256', name: 'maxPossibleGas', type: 'uint256' },
      ],
      name: 'preRelayedCall',
      outputs: [
        { internalType: 'bytes', name: '', type: 'bytes' },
        { internalType: 'bool', name: '', type: 'bool' },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address[]', name: '_targets', type: 'address[]' },
      ],
      name: 'removeTargets',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'contract IRelayHub', name: 'hub', type: 'address' },
      ],
      name: 'setRelayHub',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: 'forwarder', type: 'address' }],
      name: 'setTrustedForwarder',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'string', name: '_version', type: 'string' }],
      name: 'setVersion',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
      name: 'supportsInterface',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: '', type: 'address' }],
      name: 'targets',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'version',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'versionPaymaster',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
        { internalType: 'address payable', name: 'target', type: 'address' },
      ],
      name: 'withdrawRelayHubDepositTo',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    { stateMutability: 'payable', type: 'receive' },
  ])
  const paymasterContract = new ethers.Contract(
    GSN_MUMBAI_PAYMASTER_CONTRACT_ADDRESS,
    PaymasterInterface,
    deployer
  )

  const tx = await paymasterContract.addTargets([
    '0x0c126daEe63509728704101FB2084ad0D98C2F12',
  ])
  await tx.wait()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
