# Ketl attestation token

ERC1155 token obtained from ketl SealCred attestations

## Usage

1. Clone the repository with `git clone git@github.com:BigWhaleLabs/ketl-attestation-token`
2. Create `.env` and fill it, you can take data from 1password, consider looking into `.env.sample`
3. Install the dependencies with `yarn`
4. Compile the contract with `yarn build`
5. Find inputs in 1password and download them
   4.1. Find "Ketl members" - 0.txt
   4.2. Find "YC" - 1.txt
   4.3. Find "Founders" - 2.txt
   4.4. Find "VC" - 3.txt
6. Add `0.txt, 1.txt, 2.txt, 3.txt` files into `merkleTrees/` folder
7. Run the command `yarn update-merkle-root`, follow instructions in the prompt

## Environment variables

| Name                         | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `ETHERSCAN_API_KEY`          | Etherscan API key                                         |
| `ETH_RPC`                    | Ethereum RPC URL                                          |
| `CONTRACT_OWNER_PRIVATE_KEY` | Private key of the contract owner to deploy the contracts |
| `COINMARKETCAP_API_KEY`      | Coinmarketcap API key                                     |

Also check out the `.env.sample` file for more information.

## Available scripts

- `yarn build` — compiles the contract ts interface to the `typechain` directory
- `yarn test` — runs the test suite
- `yarn deploy` — deploys the contract to the network
- `yarn eth-lint` — runs the linter for the solidity contract
- `yarn lint` — runs all the linters
- `yarn prettify` — prettifies the code in th project
- `yarn release` — releases the `typechain` directory to NPM
