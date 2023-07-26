import {
  ATTESTATION_VERIFIER_CONTRACT_ADDRESS,
  ATTESTOR_PUBLIC_KEY,
  DEV_KETL_ATTESTATION_CONTRACT,
  GSN_MUMBAI_FORWARDER_CONTRACT_ADDRESS,
  INCREMENTAL_BINARY_TREE_ADDRESS,
  PASSWORD_VERIFIER_CONTRACT_ADDRESS,
  PROD_KETL_ATTESTATION_CONTRACT,
} from '@big-whale-labs/constants'
import { BigNumber, utils } from 'ethers'
import { KetlAttestation, KetlAttestation__factory } from '../typechain'
import { ethers, run, upgrades } from 'hardhat'
import {
  getLegacyMintCalldata,
  getLegacyRegisterEntanglementCalldata,
  getLegacyTokenHolders,
} from './helpers'
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

  const { isProduction } = await prompt.get({
    properties: {
      isProduction: { required: true, type: 'boolean', default: false },
    },
  })

  const {
    oldKetlAttestationContractAddress,
    attestationVerifierAddress,
    passwordVerifierAddress,
    attestorPublicKey,
    forwarder,
    baseURI,
    incrementalBinaryTreeLibAddress,
    shouldTransferOldAccounts,
    maxEntanglementsPerAttestationType,
  } = await prompt.get({
    properties: {
      oldKetlAttestationContractAddress: {
        required: true,
        default: isProduction
          ? PROD_KETL_ATTESTATION_CONTRACT
          : DEV_KETL_ATTESTATION_CONTRACT,
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
      maxEntanglementsPerAttestationType: {
        type: 'number',
        require: true,
        default: 3,
      },
    },
  })

  console.log(`Deploying ${contractName}...`)
  const contractFactory = await ethers.getContractFactory(contractName, {
    libraries: {
      IncrementalBinaryTree: incrementalBinaryTreeLibAddress,
    },
  })

  const newKetlAttestationContract = (await upgrades.deployProxy(
    contractFactory,
    [
      baseURI,
      version,
      attestorPublicKey,
      attestationVerifierAddress,
      passwordVerifierAddress,
      forwarder,
    ],
    { initializer: 'initialize', unsafeAllowLinkedLibraries: true }
  )) as KetlAttestation

  console.log(
    'Deploy tx gas price:',
    utils.formatEther(
      newKetlAttestationContract.deployTransaction.gasPrice || 0
    )
  )
  console.log(
    'Deploy tx gas limit:',
    utils.formatEther(newKetlAttestationContract.deployTransaction.gasLimit)
  )
  await newKetlAttestationContract.deployed()

  const proxyAddress = newKetlAttestationContract.address
  const contractImplementationAddress =
    await upgrades.erc1967.getImplementationAddress(
      newKetlAttestationContract.address
    )
  const contractAdminAddress = await upgrades.erc1967.getAdminAddress(
    newKetlAttestationContract.address
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
    const oldKetlAttesationContract = await KetlAttestation__factory.connect(
      oldKetlAttestationContractAddress,
      provider
    )

    const attestationMerkleRoots: { [key: number]: BigNumber } = {}
    for (const attestationType of [0, 1, 2, 3]) {
      const attestationMerkleRoot =
        await oldKetlAttesationContract.attestationMerkleRoots(attestationType)
      attestationMerkleRoots[attestationType] = attestationMerkleRoot
      const minimumEntanglementCount =
        await oldKetlAttesationContract.minimumEntanglementCounts(
          attestationType
        )
      const setAttestationMerkleRootTx =
        await newKetlAttestationContract.setAttestationMerkleRoot(
          attestationType,
          attestationMerkleRoot,
          minimumEntanglementCount
        )
      await setAttestationMerkleRootTx.wait()
      const setMaxEntanglementsTx =
        await newKetlAttestationContract.setMaxEntanglementsPerAttestationType(
          attestationType,
          maxEntanglementsPerAttestationType
        )
      await setMaxEntanglementsTx.wait()
    }

    const [holders, attestationTypes] = await getLegacyTokenHolders(
      oldKetlAttestationContractAddress,
      provider
    )
    const batchMintTx = await newKetlAttestationContract.legacyBatchMint(
      holders,
      attestationTypes
    )
    await batchMintTx.wait()
    const lockMintTx = await newKetlAttestationContract.lockLegacyMint()
    await lockMintTx.wait()
    console.log('Completed locking legacy mint')

    const legacyRegisterEntanglementCalldata =
      await getLegacyRegisterEntanglementCalldata(
        oldKetlAttestationContractAddress,
        provider
      )
    for (const calldata of legacyRegisterEntanglementCalldata) {
      const attestationType = BigNumber.from(calldata.input[0])
      const attestationHash = BigNumber.from(calldata.input[3])
      const entanglement = BigNumber.from(calldata.input[2])
      const registerEntanglementTx =
        await newKetlAttestationContract.legacyRegisterEntanglement(
          attestationType,
          attestationHash,
          entanglement
        )
      await registerEntanglementTx.wait()
    }
    const lockRegisterEntanglementTx =
      await newKetlAttestationContract.lockLegacyRegisterEntanglement()
    await lockRegisterEntanglementTx.wait()

    console.log('Completed legacy register entanglement')

    const legacyMintCalldata = await getLegacyMintCalldata(
      oldKetlAttestationContractAddress,
      provider
    )
    const nullifiers = legacyMintCalldata.map((calldata) =>
      BigNumber.from(calldata.input[1])
    )
    const setNullifiersTx = await newKetlAttestationContract.legacySetNullifers(
      nullifiers
    )
    await setNullifiersTx.wait()
    const lockNullifiersTx =
      await newKetlAttestationContract.lockLegacySetNullifiers()
    await lockNullifiersTx.wait()
    console.log('Completed legacy set nullifiers')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
