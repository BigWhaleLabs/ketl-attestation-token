import { ethers } from 'hardhat'
import { poseidonContract } from 'circomlibjs'

export default async function getIncrementalTreeContract() {
  const poseidonT3ABI = poseidonContract.generateABI(2)
  const poseidonT3Bytecode = poseidonContract.createCode(2)
  const [signer] = await ethers.getSigners()
  const PoseidonLibT3Factory = new ethers.ContractFactory(
    poseidonT3ABI,
    poseidonT3Bytecode,
    signer
  )
  const poseidonT3Lib = await PoseidonLibT3Factory.deploy()
  await poseidonT3Lib.deployed()

  const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory(
    'IncrementalBinaryTree',
    {
      libraries: {
        PoseidonT3: poseidonT3Lib.address,
      },
    }
  )
  const incrementalBinaryTreeLib =
    await IncrementalBinaryTreeLibFactory.deploy()
  await incrementalBinaryTreeLib.deployed()

  return incrementalBinaryTreeLib.address
}
