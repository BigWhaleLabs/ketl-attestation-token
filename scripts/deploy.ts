import {
  ATTESTOR_PUBLIC_KEY,
  GSN_MUMBAI_FORWARDER_CONTRACT_ADDRESS,
} from '@big-whale-labs/constants'
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

  console.log(`Deploying ${contractName}...`)
  const Contract = await ethers.getContractFactory(contractName)
  const { verifierAddress, attestorPublicKey, forwarder, baseURI } =
    await prompt.get({
      properties: {
        verifierAddress: {
          required: true,
          pattern: ethereumAddressRegex,
          default: '0x4Acf6F64Df9Ccf7277D722963b7055f37C4b2525',
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
      },
    })

  const contract = await Contract.deploy(
    baseURI,
    version,
    attestorPublicKey,
    verifierAddress,
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
        verifierAddress,
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

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
