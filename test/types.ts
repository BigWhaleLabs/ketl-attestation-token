import {
  IncrementalBinaryTree,
  IncrementalBinaryTree__factory,
  KetlAttestation,
  KetlAttestation__factory,
  PoseidonT3,
  PoseidonT3__factory,
} from '../typechain'
import { MockContract } from 'ethereum-waffle'

declare module 'mocha' {
  export interface Context {
    // Factories for contracts
    poseidonT3Factory: PoseidonT3__factory
    incrementalBinaryTreeFactory: IncrementalBinaryTree__factory
    ketlAttestationFactory: KetlAttestation__factory
    // Contract instances
    poseidonT3: PoseidonT3
    incrementalBinaryTree: IncrementalBinaryTree
    ketlAttestation: KetlAttestation
    // Mock contracts
    fakeAttestationCheckerVerifier: MockContract
    fakePasswordCheckerVerifier: MockContract
  }
}
