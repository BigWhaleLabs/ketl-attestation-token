import {
  ATTESTOR_PUBLIC_KEY,
  GSN_MUMBAI_FORWARDER_CONTRACT_ADDRESS,
} from '@big-whale-labs/constants'
import { ethers, run } from 'hardhat'
import { utils } from 'ethers'
import { version } from '../package.json'
import getIncrementalTreeContract from '../test/getIncrementalTreeContract'
import prompt from 'prompt'

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/

function getEtherscanUrl(chainName: string, chainId: number, address: string) {
  const etherscanBaseUrl =
    chainId === 80001 ? 'polygonscan.com' : 'etherscan.io'
  return `https://${
    !chainName.includes('mainnet') ? `${chainName}.` : ''
  }${etherscanBaseUrl}/address/${address}`
}

async function deployIncrementalBinaryTreeLib() {
  console.log(`Deploying incrementalBinaryTreeLib...`)
  const address = await getIncrementalTreeContract()
  console.log(`IncrementalBinaryTreeLib deployed to ${address}`)

  await new Promise((resolve) => setTimeout(resolve, 30 * 1000))
  try {
    await run('verify:verify', {
      address,
    })
  } catch (error) {
    parseError(error)
  }

  return address
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
        default: '0x3C62f429a8e9a42b5E6Cce09239266593DB3747f',
        pattern: ethereumAddressRegex,
      },
      passwordVerifierAddress: {
        required: true,
        default: '0xBeD245BdAE228F006E60BE50aB2cA97282eD8a91',
        pattern: ethereumAddressRegex,
      },
      attestorPublicKey: {
        required: true,
        default:
          '4602787175697261409382197598473250464164410905837709881682647730492142844036',
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
        default: '0x96b8a618Bb30539D45164b6E0c046280E067b3B5',
        pattern: ethereumAddressRegex,
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
}

function parseError(error: Error | unknown) {
  console.log(
    'Error verifiying contract on Etherscan:',
    error instanceof Error ? error.message : error
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
