import { HashFunction } from './poseidonHash'
import VerificationType from './VerificationType'

export default function (hash: HashFunction, id: string) {
  if (isNaN(parseInt(id, 10))) throw new Error(`Invalid number: ${id}!`)
  return hash([VerificationType.twitter, id])
}
