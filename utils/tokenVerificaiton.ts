import { HashFunction } from './poseidonHash'
import hexlifyString from './hexlifyString'

export default function (hash: HashFunction, token: string) {
  if (isNaN(parseInt(token, 10))) throw new Error(`Invalid number: ${token}!`)
  return hash([hexlifyString(token)])
}
