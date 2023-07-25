import {
  ATTESTATION_VERIFIER_CONTRACT_ADDRESS,
  ATTESTOR_PUBLIC_KEY,
  GSN_MUMBAI_FORWARDER_CONTRACT_ADDRESS,
  INCREMENTAL_BINARY_TREE_ADDRESS,
  PASSWORD_VERIFIER_CONTRACT_ADDRESS,
  PROD_KETL_ATTESTATION_CONTRACT,
} from '@big-whale-labs/constants'
import { ethers, run, upgrades } from 'hardhat'
import { getLegacyTokenHolders } from './helpers'
import { utils } from 'ethers'
import { version } from '../package.json'
import prompt from 'prompt'

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/

function getEtherscanUrl(chainName: string, chainId: number, address: string) {
  const etherscanBaseUrl =
    chainId === 80001 ? 'polygonscan.com' : 'etherscan.io'
  return `https://${
    chainName.includes('mainnet') ? '' : `${chainName}.`
  }${etherscanBaseUrl}/address/${address}`
}

async function main() {
  const [deployer] = await ethers.getSigners()

  // Deploy the contract
  console.log('Deploying contracts with the account:', deployer.address)
  console.log(
    'Account balance:',
    utils.formatEther(await deployer.getBalance())
  )

  const provider = ethers.provider
  const { chainId } = await provider.getNetwork()
  const chains = {
    1: 'mainnet',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
    80001: 'mumbai',
  } as { [chainId: number]: string }

  const chainName = chains[chainId]

  const contractName = 'KetlAttestation'

  const promptResult = await prompt.get({
    properties: {
      ketlAttestationTokenAddress: {
        required: true,
        default: PROD_KETL_ATTESTATION_CONTRACT,
        pattern: ethereumAddressRegex,
      },
      attestationVerifierAddress: {
        required: true,
        default: ATTESTATION_VERIFIER_CONTRACT_ADDRESS,
        pattern: ethereumAddressRegex,
      },
      passwordVerifierAddress: {
        required: true,
        default: PASSWORD_VERIFIER_CONTRACT_ADDRESS,
        pattern: ethereumAddressRegex,
      },
      attestorPublicKey: {
        required: true,
        default: ATTESTOR_PUBLIC_KEY,
      },
      forwarder: {
        required: true,
        pattern: ethereumAddressRegex,
        default: GSN_MUMBAI_FORWARDER_CONTRACT_ADDRESS,
      },
      baseURI: {
        required: true,
        default: 'https://metadata.sealcred.xyz',
      },
      incrementalBinaryTreeLibAddress: {
        required: true,
        default: INCREMENTAL_BINARY_TREE_ADDRESS,
        pattern: ethereumAddressRegex,
      },
      shouldTransferOldAccounts: {
        type: 'boolean',
        required: true,
        default: true,
      },
    },
  })

  const {
    ketlAttestationTokenAddress,
    attestationVerifierAddress,
    passwordVerifierAddress,
    attestorPublicKey,
    forwarder,
    baseURI,
    incrementalBinaryTreeLibAddress,
    shouldTransferOldAccounts,
  } = promptResult

  console.log(`Deploying ${contractName}...`)
  const contractFactory = await ethers.getContractFactory(contractName, {
    libraries: {
      IncrementalBinaryTree: incrementalBinaryTreeLibAddress,
    },
  })

  const contract = await upgrades.deployProxy(
    contractFactory,
    [
      baseURI,
      version,
      attestorPublicKey,
      attestationVerifierAddress,
      passwordVerifierAddress,
      forwarder,
    ],
    { initializer: 'initializer', unsafeAllowLinkedLibraries: true }
  )

  console.log(
    'Deploy tx gas price:',
    utils.formatEther(contract.deployTransaction.gasPrice || 0)
  )
  console.log(
    'Deploy tx gas limit:',
    utils.formatEther(contract.deployTransaction.gasLimit)
  )
  await contract.deployed()

  const proxyAddress = contract.address
  const contractImplementationAddress =
    await upgrades.erc1967.getImplementationAddress(contract.address)
  const contractAdminAddress = await upgrades.erc1967.getAdminAddress(
    contract.address
  )

  console.log(`${contractName} Proxy address: `, proxyAddress)
  console.log(
    `${contractName} Implementation address: `,
    contractImplementationAddress
  )
  console.log(`${contractName} Admin address: `, contractAdminAddress)

  console.log('Wait for 1 minute to make sure blockchain is updated')
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000))

  // Try to verify the contract on Etherscan
  console.log('Verifying contract on Etherscan')
  try {
    await run('verify:verify', {
      address: contractImplementationAddress,
      constructorArguments: [
        baseURI,
        version,
        attestorPublicKey,
        attestationVerifierAddress,
        passwordVerifierAddress,
        forwarder,
      ],
    })
  } catch (err) {
    console.error(
      'Error verifying contract on Etherscan:',
      err instanceof Error ? err.message : err
    )
  }

  // Print out the information
  console.log(`${contractName} deployed and verified on Etherscan!`)
  console.log('Contract address:', proxyAddress)
  console.log(
    'Etherscan URL:',
    getEtherscanUrl(chainName, chainId, proxyAddress)
  )

  if (shouldTransferOldAccounts) {
    const [holders, attestationTypes] = await getLegacyTokenHolders(
      ketlAttestationTokenAddress,
      provider
    )
    await contract.legacyBatchMint(holders, attestationTypes)
    await contract.lockLegacyMint()
    console.log('Completed locking legacy mint')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
