import { BigNumber, providers } from 'ethers'
import { DEV_KETL_ATTESTATION_CONTRACT } from '@big-whale-labs/constants'
import { KetlAttestation, KetlAttestation__factory } from '../typechain'
import { ethers, upgrades } from 'hardhat'
import { expect } from 'chai'
import { getFakeAttestationCheckerVerifier } from './utils/fakes'
import { getLegacyTokenHolders } from '../scripts/helpers'
import legacyMintCalldata from '../legacy/dev-mint.json'
import legacyRegisterEntanglementCalldata from '../legacy/dev-register-entanglements.json'

describe.only('KetlAttestation Deploy Tests', () => {
  it('should be able to deploy KetlAttestation and populate data correctly', async function () {
    const uri = 'https://game.example/api/item/{id}.json'
    const version = '0.0.1'

    const realProvider = new providers.JsonRpcProvider(
      process.env.ETH_RPC,
      'maticmum'
    )
    const realKetlAttesation = await KetlAttestation__factory.connect(
      DEV_KETL_ATTESTATION_CONTRACT,
      realProvider
    )
    const attestorPublicKey = await realKetlAttesation.attestorPublicKey()

    this.signers = await ethers.getSigners()
    this.owner = this.signers[0]
    this.user = this.signers[1]

    this.poseidonT3Factory = await ethers.getContractFactory('PoseidonT3')
    this.poseidonT3 = await this.poseidonT3Factory.deploy()
    await this.poseidonT3.deployed()

    this.incrementalBinaryTreeFactory = await ethers.getContractFactory(
      'IncrementalBinaryTree',
      {
        libraries: {
          PoseidonT3: this.poseidonT3.address,
        },
      }
    )
    this.incrementalBinaryTree =
      await this.incrementalBinaryTreeFactory.deploy()
    await this.incrementalBinaryTree.deployed()

    this.ketlAttestationFactory = await ethers.getContractFactory(
      'KetlAttestation',
      {
        libraries: {
          IncrementalBinaryTree: this.incrementalBinaryTree.address,
        },
      }
    )

    this.fakeAttestationCheckerVerifier =
      await getFakeAttestationCheckerVerifier(this.owner)
    this.fakePasswordCheckerVerifier = await getFakeAttestationCheckerVerifier(
      this.owner
    )
    await this.fakeAttestationCheckerVerifier.mock.verifyProof.returns(true)

    this.ketlAttestation = (await upgrades.deployProxy(
      this.ketlAttestationFactory,
      [
        uri,
        version,
        attestorPublicKey,
        this.fakeAttestationCheckerVerifier.address,
        this.fakePasswordCheckerVerifier.address,
        ethers.constants.AddressZero,
      ],
      { unsafeAllowLinkedLibraries: true }
    )) as KetlAttestation
    await this.ketlAttestation.deployed()

    const attestationMerkleRoots: { [key: number]: BigNumber } = {}
    for (const attestationType of [0, 1, 2, 3]) {
      const attestationMerkleRoot =
        await realKetlAttesation.attestationMerkleRoots(attestationType)
      attestationMerkleRoots[attestationType] = attestationMerkleRoot
      const minimumEntanglementCount =
        await realKetlAttesation.minimumEntanglementCounts(attestationType)

      await this.ketlAttestation.setAttestationMerkleRoot(
        attestationType,
        attestationMerkleRoot,
        minimumEntanglementCount
      )
      expect(
        await this.ketlAttestation.minimumEntanglementCounts(attestationType)
      ).to.equal(minimumEntanglementCount)
      expect(
        await this.ketlAttestation.attestationMerkleRoots(attestationType)
      ).to.equal(attestationMerkleRoot)

      await this.ketlAttestation.setMaxEntanglementsPerAttestationType(
        attestationType,
        3
      )
      expect(
        await this.ketlAttestation.maxEntanglementsPerAttestationType(
          attestationType
        )
      ).to.equal(3)
    }

    const [holders, attestationTypes] = await getLegacyTokenHolders(
      DEV_KETL_ATTESTATION_CONTRACT,
      realProvider
    )
    console.log(holders)
    await this.ketlAttestation.legacyBatchMint(holders, attestationTypes)
    await this.ketlAttestation.lockLegacyMint()
    console.log('Completed locking legacy mint')

    for (const originalCalldata of legacyRegisterEntanglementCalldata) {
      const attestationType = BigNumber.from(
        originalCalldata.inputs[0]
      ).toNumber()
      const calldata = [
        originalCalldata.a,
        originalCalldata.b,
        originalCalldata.c,
        [
          originalCalldata.inputs[0],
          attestationMerkleRoots[attestationType],
          originalCalldata.inputs[2],
          originalCalldata.inputs[3],
          originalCalldata.inputs[4],
        ],
      ] as const
      await this.ketlAttestation.registerEntanglement(...calldata)
    }
    console.log('Completed legacy register entanglement')

    const nullifiers = Object.values(legacyMintCalldata).map((calldata) =>
      BigNumber.from(calldata.inputs[1])
    )
    await this.ketlAttestation.legacySetNullifers(nullifiers)
    await this.ketlAttestation.lockLegacySetNullifiers()
    console.log('Completed legacy set nullifiers')
  }).timeout(1_000_000)
})
