import { KetlAttestation } from '../typechain'
import { ethers, upgrades } from 'hardhat'
import { expect } from 'chai'
import { getFakeAttestationCheckerVerifier, getMockProof } from './utils/fakes'

describe('KetlAttestation contract tests', () => {
  before(async function () {
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
  })

  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const uri = 'https://game.example/api/item/{id}.json'
      const version = '0.0.1'
      const attestorPublicKey = 1234
      const attestationCheckerVerifier =
        '0x0000000000000000000000000000000000000000'
      const passwordCheckerVerifier =
        '0x0000000000000000000000000000000000000001'
      const forwarder = '0x0000000000000000000000000000000000000002'

      const contract = (await upgrades.deployProxy(
        this.ketlAttestationFactory,
        [
          uri,
          version,
          attestorPublicKey,
          attestationCheckerVerifier,
          passwordCheckerVerifier,
          forwarder,
        ],
        { unsafeAllowLinkedLibraries: true }
      )) as KetlAttestation
      expect(await contract.uri(0)).to.equal(
        'https://game.example/api/item/{id}.json'
      )
      expect(await contract.version()).to.equal(version)
      expect(await contract.attestorPublicKey()).to.equal(attestorPublicKey)
      expect(await contract.attestationCheckerVerifier()).to.equal(
        attestationCheckerVerifier
      )
      expect(await contract.passwordCheckerVerifier()).to.equal(
        passwordCheckerVerifier
      )
    })
  })

  describe('registerEntangement', () => {
    const uri = 'https://game.example/api/item/{id}.json'
    const version = '0.0.1'

    const attestationType = 0
    const attestorPublicKey = 1234
    const attestationMerkleRoot = 5678
    const entanglement = 0
    const attestationHash = 9999
    const minimumEntanglementCount = 5
    const maximumEntanglements = 3

    beforeEach(async function () {
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
      await this.ketlAttestation.setAttestationMerkleRoot(
        attestationType,
        attestationMerkleRoot,
        minimumEntanglementCount
      )
      await this.ketlAttestation.setMaxEntanglementsPerAttestationType(
        attestationType,
        maximumEntanglements
      )
    })
    it('should register an entanglement with the correct proof', async function () {
      await this.fakeAttestationCheckerVerifier.mock.verifyProof.returns(true)
      const { a, b, c, input } = getMockProof(
        attestationType,
        attestationMerkleRoot,
        entanglement,
        attestationHash,
        attestorPublicKey
      )
      await this.ketlAttestation
        .connect(this.user)
        .registerEntanglement(a, b, c, input)
      expect(
        await this.ketlAttestation.attestationHashesEntangled(attestationHash)
      ).to.equal(1)
    })
    it('should not be able to register an entanglement with incorrect proof', async function () {
      await this.fakeAttestationCheckerVerifier.mock.verifyProof.returns(false)
      const { a, b, c, input } = getMockProof(
        attestationType,
        attestationMerkleRoot,
        entanglement,
        attestationHash,
        attestorPublicKey
      )
      await expect(
        this.ketlAttestation
          .connect(this.user)
          .registerEntanglement(a, b, c, input)
      ).to.be.revertedWith('Invalid ZK proof')
      expect(
        await this.ketlAttestation.attestationHashesEntangled(attestationHash)
      ).to.equal(0)
    })
    it('should allow for multiple entanglements to be registered with the same proof if maxEntanglementsPerAttestationType is set', async function () {
      await this.fakeAttestationCheckerVerifier.mock.verifyProof.returns(true)
      const { a, b, c, input } = getMockProof(
        attestationType,
        attestationMerkleRoot,
        entanglement,
        attestationHash,
        attestorPublicKey
      )
      for (let i = 0; i < maximumEntanglements; i++) {
        await this.ketlAttestation
          .connect(this.user)
          .registerEntanglement(a, b, c, input)
      }
      expect(
        await this.ketlAttestation.attestationHashesEntangled(attestationHash)
      ).to.equal(maximumEntanglements)
      await expect(
        this.ketlAttestation
          .connect(this.user)
          .registerEntanglement(a, b, c, input)
      ).to.be.revertedWith('Attestation has been used too many times')
      expect(
        await this.ketlAttestation.attestationHashesEntangled(attestationHash)
      ).to.equal(maximumEntanglements)
    })
  })
})
