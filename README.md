# Ketl attestation token

ERC1155 token obtained from ketl SealCred attestations

## Usage

1. Clone the repository with `git clone git@github.com:BigWhaleLabs/ketl-attestation-token`
2. Create `.env` and fill it, you can take data from 1password, consider looking into `.env.sample`
3. Install the dependencies with `yarn`
4. Compile the contract with `yarn build`

### Updating merkle trees

1. Make sure you have access to [ketl-merkle-trees](https://github.com/BigWhaleLabs/ketl-merkle-trees)
2. Install submodules `git submodule update --init --recursive`
3. Run the command `yarn update-merkle-root`, follow instructions in the prompt

You can also update submodules by running `git submodule update --remote --merge`.

### Minting BWLNFT test token:

1. Open [BWLNFT test token contact](https://polygonscan.com/address/0x6B511660CD2B0137fdA46EDfe72A995A442AF9b4)
2. Mint BWLNFT test token:

   1. If you want to mint for other addresses, use `legacyBatchMint` function. It can be used only by `owner`, you can find credentials in 1pass (search for `owner`)
   2. If you want to mint for yourself, simply call `mint` function

3. Add the new addresses to [ketl-merkle-trees](https://github.com/BigWhaleLabs/ketl-merkle-trees) like `bwlnft:{address}`

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
