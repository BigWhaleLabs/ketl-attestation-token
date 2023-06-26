import { HashFunction } from './poseidonHash'
import VerificationType from './VerificationType'
import hexlifyString from './hexlifyString'

export default function (hash: HashFunction, email: string) {
  return hash([VerificationType.email, hexlifyString(email)])
}
