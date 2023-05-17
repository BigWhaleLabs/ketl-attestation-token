import { KetlAttestation } from '../typechain'
import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('KetlAttestation contract tests', () => {
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

      const PoseidonT3Factory = await ethers.getContractFactory('PoseidonT3')
      const poseidonT3 = await PoseidonT3Factory.deploy()
      await poseidonT3.deployed()

      const IncrementalBinaryTreeFactory = await ethers.getContractFactory(
        'IncrementalBinaryTree',
        {
          libraries: {
            PoseidonT3: poseidonT3.address,
          },
        }
      )
      const incrementalBinaryTree = await IncrementalBinaryTreeFactory.deploy()
      await incrementalBinaryTree.deployed()

      const factory = await ethers.getContractFactory('KetlAttestation', {
        libraries: {
          IncrementalBinaryTree: incrementalBinaryTree.address,
        },
      })
      const contract: KetlAttestation = await factory.deploy(
        uri,
        version,
        attestorPublicKey,
        attestationCheckerVerifier,
        passwordCheckerVerifier,
        forwarder
      )
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
})
