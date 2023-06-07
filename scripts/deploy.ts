import {
  ATTESTATION_VERIFIER_CONTRACT_ADDRESS,
  ATTESTOR_PUBLIC_KEY,
  GSN_MUMBAI_FORWARDER_CONTRACT_ADDRESS,
  INCREMENTAL_BINARY_TREE_ADDRESS,
  PASSWORD_VERIFIER_CONTRACT_ADDRESS,
} from '@big-whale-labs/constants'
import { KetlAllowMap__factory } from '@big-whale-labs/ketl-allow-map-contract'
import { Provider } from '@ethersproject/providers'
import { ethers, run } from 'hardhat'
import { utils } from 'ethers'
import { version } from '../package.json'
import prompt from 'prompt'

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/

function getEtherscanUrl(chainName: string, chainId: number, address: string) {
  const etherscanBaseUrl =
    chainId === 80001 ? 'polygonscan.com' : 'etherscan.io'
  return `https://${
    !chainName.includes('mainnet') ? `${chainName}.` : ''
  }${etherscanBaseUrl}/address/${address}`
}

const KetlAllowMapInterface = new utils.Interface(KetlAllowMap__factory.abi)

function parseAccountAddress(args: { data: string; topics: string[] }) {
  return KetlAllowMapInterface.parseLog(args).args[0]
}

async function getCountAddressAddedToAllowMap(
  address: string,
  provider: Provider
) {
  const contract = KetlAllowMap__factory.connect(address, provider)

  const transactions = await contract.queryFilter(
    contract.filters.AddressAddedToAllowMap()
  )

  return transactions.map(parseAccountAddress)
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
      shouldTransferOldAccountsl: {
        type: 'boolean',
        required: true,
        default: true,
      },
    },
  })

  const {
    attestationVerifierAddress,
    passwordVerifierAddress,
    attestorPublicKey,
    forwarder,
    baseURI,
    incrementalBinaryTreeLibAddress,
    shouldTransferOldAccountsl,
  } = promptResult

  console.log(`Deploying ${contractName}...`)
  const Contract = await ethers.getContractFactory(contractName, {
    libraries: {
      IncrementalBinaryTree: incrementalBinaryTreeLibAddress,
    },
  })

  const contract = await Contract.deploy(
    baseURI,
    version,
    attestorPublicKey,
    attestationVerifierAddress,
    passwordVerifierAddress,
    forwarder
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
  const address = contract.address

  console.log('Contract deployed to:', address)
  console.log('Wait for 1 minute to make sure blockchain is updated')
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000))

  // Try to verify the contract on Etherscan
  console.log('Verifying contract on Etherscan')
  try {
    await run('verify:verify', {
      address,
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
    console.log(
      'Error verifiying contract on Etherscan:',
      err instanceof Error ? err.message : err
    )
  }

  // Print out the information
  console.log(`${contractName} deployed and verified on Etherscan!`)
  console.log('Contract address:', address)
  console.log('Etherscan URL:', getEtherscanUrl(chainName, chainId, address))

  if (shouldTransferOldAccountsl) {
    console.log('Import old founders accounts...')
    const oldFounderContract = '0x91002bd44b9620866693fd8e03438e69e01563ee'
    const founders = await getCountAddressAddedToAllowMap(
      oldFounderContract,
      provider
    )
    await contract.legacyBatchMint(
      founders,
      founders.map(() => 2)
    )

    console.log('Import old VS accounts...')
    const oldVcContract = '0xe8c7754340b9f0efe49dfe0f9a47f8f137f70477'
    const vc = await getCountAddressAddedToAllowMap(oldVcContract, provider)
    await contract.legacyBatchMint(
      vc,
      vc.map(() => 3)
    )

    await contract.lockLegacyMint()
    console.log('Complete! Lock legacy mint')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
