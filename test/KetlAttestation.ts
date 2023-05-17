import { KetlAttestation } from '../typechain'
import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('KetlAttestation contract tests', () => {
  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const uri = 'https://game.example/api/item/{id}.json'
      const version = '0.0.1'
      const attestorPublicKey = 1234
      const attestationCheckerVerifier = ethers.constants.AddressZero
      const forwarder = '0x0000000000000000000000000000000000000000'
      const factory = await ethers.getContractFactory('KetlAttestation')
      const contract: KetlAttestation = await factory.deploy(
        uri,
        version,
        attestorPublicKey,
        attestationCheckerVerifier,
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
    })
  })
})
