import { KetlAttestation } from 'typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { deployMockContract } from 'ethereum-waffle'

export function getFakeAttestationCheckerVerifier(signer: SignerWithAddress) {
  return deployMockContract(signer, [
    {
      inputs: [
        { internalType: 'uint256[2]', name: 'a', type: 'uint256[2]' },
        { internalType: 'uint256[2][2]', name: 'b', type: 'uint256[2][2]' },
        { internalType: 'uint256[2]', name: 'c', type: 'uint256[2]' },
        { internalType: 'uint256[5]', name: 'input', type: 'uint256[5]' },
      ],
      name: 'verifyProof',
      outputs: [{ internalType: 'bool', name: 'r', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
  ])
}

export function getFakePasswordCheckerVerifier(signer: SignerWithAddress) {
  return deployMockContract(signer, [
    {
      inputs: [
        { internalType: 'uint256[2]', name: 'a', type: 'uint256[2]' },
        { internalType: 'uint256[2][2]', name: 'b', type: 'uint256[2][2]' },
        { internalType: 'uint256[2]', name: 'c', type: 'uint256[2]' },
        { internalType: 'uint256[3]', name: 'input', type: 'uint256[3]' },
      ],
      name: 'verifyProof',
      outputs: [{ internalType: 'bool', name: 'r', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
  ])
}

export function getMockProof(
  attestationType: number,
  attestationMerkleRoot: number,
  entanglement: number,
  attestationHash: number,
  attestorPublicKey: number
): {
  a: Parameters<KetlAttestation['registerEntanglement']>[0]
  b: Parameters<KetlAttestation['registerEntanglement']>[1]
  c: Parameters<KetlAttestation['registerEntanglement']>[2]
  input: Parameters<KetlAttestation['registerEntanglement']>[3]
} {
  return {
    a: [1, 2],
    b: [
      [1, 2],
      [3, 4],
    ],
    c: [1, 2],
    input: [
      attestationType,
      attestationMerkleRoot,
      entanglement,
      attestationHash,
      attestorPublicKey,
    ],
  }
}
