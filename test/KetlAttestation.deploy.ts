import { BigNumber, providers } from 'ethers'
import { DEV_KETL_ATTESTATION_CONTRACT } from '@big-whale-labs/constants'
import { KetlAttestation, KetlAttestation__factory } from '../typechain'
import { ethers, upgrades } from 'hardhat'
import { expect } from 'chai'
import { getFakeAttestationCheckerVerifier } from './utils/fakes'
import {
  getLegacyMintCalldata,
  getLegacyRegisterEntanglementCalldata,
  getLegacyTokenHolders,
} from '../scripts/helpers'
import AttestationType from '../models/AttestationType'

describe('KetlAttestation Deploy Tests', () => {
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
    for (const typeName in AttestationType) {
      const attestationType = AttestationType[typeName]
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
    await this.ketlAttestation.legacyBatchMint(holders, attestationTypes)
    await this.ketlAttestation.lockLegacyMint()
    console.log('Completed locking legacy mint')

    const legacyRegisterEntanglementCalldata =
      await getLegacyRegisterEntanglementCalldata(
        DEV_KETL_ATTESTATION_CONTRACT,
        realProvider
      )
    for (const calldata of legacyRegisterEntanglementCalldata) {
      const attestationType = BigNumber.from(calldata.input[0])
      const attestationHash = BigNumber.from(calldata.input[3])
      const entanglement = BigNumber.from(calldata.input[2])
      await this.ketlAttestation.legacyRegisterEntanglement(
        attestationType,
        attestationHash,
        entanglement
      )
    }
    await this.ketlAttestation.lockLegacyRegisterEntanglement()
    console.log('Completed legacy register entanglement')

    const legacyMintCalldata = await getLegacyMintCalldata(
      DEV_KETL_ATTESTATION_CONTRACT,
      realProvider
    )
    const nullifiers = legacyMintCalldata.map((calldata) =>
      BigNumber.from(calldata.input[1])
    )
    await this.ketlAttestation.legacySetNullifers(nullifiers)
    await this.ketlAttestation.lockLegacySetNullifiers()
    console.log('Completed legacy set nullifiers')

    // Check if token balances, entanglement counts, merkle roots and nullifiers are correct
    expect(
      await this.ketlAttestation.balanceOf(
        '0x006778056f3687c8e717431fd128a4a411256855',
        2
      )
    ).to.equal(1)
    expect(
      await this.ketlAttestation.balanceOf(
        '0x00baf0ccacf5138186e9255c33d4ad5813a126f6',
        3
      )
    ).to.equal(1)
    expect(await this.ketlAttestation.entanglementsCounts(0)).to.equal(39)
    expect(await this.ketlAttestation.entanglementsCounts(1)).to.equal(16)
    expect(await this.ketlAttestation.entanglementsCounts(2)).to.equal(18)
    expect(await this.ketlAttestation.entanglementsCounts(3)).to.equal(15)
    expect(await this.ketlAttestation.attestationMerkleRoots(0)).to.equal(
      '5335291072005543461858606182043733799865352927066551747970584326785146418876'
    )
    expect(await this.ketlAttestation.attestationMerkleRoots(1)).to.equal(
      '5418361909092638240736490124596229346210919292114889237217958430414034473557'
    )
    expect(await this.ketlAttestation.attestationMerkleRoots(2)).to.equal(
      '10381400511710919614534315002504293828042363615301039129800554466533909625238'
    )
    expect(await this.ketlAttestation.attestationMerkleRoots(3)).to.equal(
      '12614643060872101993059706924886792216216998862096566160866878914684590358221'
    )
    expect(await this.ketlAttestation.nullifiers(nullifiers[0])).to.equal(true)
    expect(await this.ketlAttestation.nullifiers(nullifiers[1])).to.equal(true)
    expect(await this.ketlAttestation.nullifiers(nullifiers[2])).to.equal(true)
  }).timeout(1_000_000)
})
