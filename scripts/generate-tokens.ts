import { randomBytes } from 'crypto'
import prompt from 'prompt'

function getRandomNumber() {
  const value = randomBytes(32) // 32 bytes = 256 bits
  const bigInt = BigInt(`0x${value.toString('hex')}`)
  return `${bigInt}`
}

void (async function main() {
  const { count } = await prompt.get({
    properties: {
      count: {
        required: true,
        type: 'number',
        description: 'How many tokens do you want to generate?',
      },
    },
  })
  console.log(`Generating ${count} tokens...`)
  for (let i = 0; i < count; i++) {
    console.log(`token:${getRandomNumber()}`)
  }
  console.log('Done!')
})()
