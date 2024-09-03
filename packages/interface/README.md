# MACI-PLATFORM

<div>
<a href="https://maci-platform.vercel.app/">View demo</a>
<span>|</span>
<a href="https://discord.com/invite/sF5CT5rzrR">Discord (#🗳️-maci channel)</a>
<span>|</span>
<a href="https://www.youtube.com/watch?v=86VBbO1E4Vk">Video Tutorial</a>
</div>

## Hacking PSE E2E setup instructions on Optimism Sepolia

### Mint top hat and create first hat
You'll need to mint a top hat and then create your first hat. The hat id of your first hat is the one we'll be assigning to vote participants. Learn more about hats at [the hats documentation](https://docs.hatsprotocol.xyz/)
1. Go to [the hats contract on op scan](https://sepolia-optimism.etherscan.io/address/0x3bc1a0ad72417f2d411118085256fc53cbddd137#writeContract) and connect your wallet
2. Call `mintTopHat` - You can take inspriation from [this tx](https://sepolia-optimism.etherscan.io/tx/0x57d6562494335b9ae640e97c4e3fb7f3d80a0141352652a42da6c2d9ed662804)
3. Call `createHat` - Add the id of the `HatCreated` log from the `mintTopHat` transaction as the admin (`_admin (uint256)`) for this call. Add your own address for `_eligibility (address)` & `_toggle (address)`. You can take inspiration from [this tx](https://sepolia-optimism.etherscan.io/tx/0x45bc3410ceb95cd5c760dd11ffbc99cbd8f5c3b488240612788fcf3674124edb)
4. Take the hat id from the logs of `HatCreated`, add this hat id the the `.env` files in `backend`, `contracts` and `interface`


### Deploy Semaphore contracts gated by Hats

1. Add a rpc url, deployer private key, op scan api key, hats address, and hat id to a `.env` file in `packages/contracts`. The hats address for optimism sepolia is `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`. That hats id is the value you got in the transaction logs when calling `createHat`
2. `cd packages/contracts`
3. Deploy contracts:
```bash
# Load the variables in the .env file
source .env

# To deploy and verify the contract
forge script --chain sepolia script/Hackathon.s.sol:DeploySemaphore_AndSetGate --rpc-url $SEPOLIA_RPC_URL --etherscan-api-key $ETHERSCAN_API_KEY --broadcast --verify -vvvv
```
4. Add the semahore address to `.env` in `interface`


### Deploy MACI contracts
1. Follow installation instructions for MACI if this is your first time running a maci poll https://maci.pse.dev/docs/quick-start/installation. After installing the required dependencies to your machine, setup the maci monorepo: 
```bash
# install dependencies and run pnpm build
git clone https://github.com/privacy-scaling-explorations/maci.git && \
cd maci && \
pnpm i && \
pnpm run build
```

2. You won't need to compile new circuits, but you will need to download the zkeys
```bash
# download zkeys
pnpm download-zkeys:test
```

3. Generate and safely store a coordinator key pair https://maci.pse.dev/docs/quick-start/deployment#coordinator-key
```bash
# generate a coordinator key pair - save this for later
cd packages/cli && \
node build/ts/index.js genMaciKeyPair
```

4. `cp deploy-config-example.json deploy-config.json`
    1. go to the `optimism_sepolia` json object in `deploy-config.json`
    2. set the following values to ensure maci works with the semaphore gatekeeper you deployed. Set your desired poll duration as well
    ```json
    "optimism_sepolia": {
      "FreeForAllGatekeeper": {
        "deploy": false
      },
      "SemaphoreGatekeeper": {
        "deploy": true,
        "semaphoreContract": "THE SEMAPHORE ADDRESS YOU DEPLOYED",
        "groupId": 1
      },
      "MACI": {
        "stateTreeDepth": 10,
        "gatekeeper": "SemaphoreGatekeeper"
      },
      "Poll": {
        "pollDuration": 3600, 
        "coordinatorPubkey": "YOUR MACI PUBLIC KEY GENERATED FROM genMaciKeyPair",
        "useQuadraticVoting": false
      }
    }
    ```

5. `cp default-deployed-contracts.json deployed-contracts.json`
Fill the `.env` file with the appropriate data (you will find an example in the .env.example file):
    - your mnemonic
    - an RPC key

5. `pnpm deploy:optimism-sepolia --incremental`
6. In this repo, add the maci address to `NEXT_PUBLIC_MACI_ADDRESS` in the interface `.env`

### Deploy the subgraph
In the same MACI repo, deploy the subgraph
1. `cd apps/subgraph`
2. Add the maci address and the block it was deployed in to `apps/subgraph/config/network.json`
3. `pnpm run build`
4. if you need to deploy again, remember to increment the version label each time
```bash
graph deploy test-maci-vote \                                                                                                                               
  --version-label v0.0.1 \
  --node https://subgraphs.alchemy.com/api/subgraphs/deploy \
  --deploy-key YOUR_DEPLOY_KEY \
  --ipfs https://ipfs.satsuma.xyz/
```

### Start frontend + backend
From the root of this repo
1. `pnpm install && pnpm build`
2. `pnpm dev:server`
3. `pnpm dev:interface`

### Deploy a poll
1. in the maci repo, run `pnpm deploy-poll:optimism-sepolia`

## Supported Networks

All networks EAS is deployed to are supported. If a network is not supported, you can follow the EAS documentation to deploy the contracts to the network.

- https://docs.attest.sh/docs/quick--start/contracts

#### Mainnets

- Ethereum
- Optimism
- Base
- Arbitrum One & Nova
- Polygon
- Scroll
- Celo
- Linea

#### Testnets

- Sepolia
- Optimism Sepolia
- Base Sepolia
- Polygon Mumbai
- Scroll Sepolia

### Technical details

- **EAS** - Projects, profiles, etc are all stored on-chain in Ethereum Attestation Service
- **Batched requests with tRPC** - Multiple requests are batched into one (for example when the frontend requests the metadata for 24 projects they are batched into 1 request)
- **Server-side caching of requests to EAS and IPFS** - Immediately returns the data without calling EAS and locally serving ipfs cids.
- **MACI** - Minimal Anti-Collusion Infrastructure (MACI) is an open-source public good that serves as infrastructure for private on-chain voting, handles the rounds and private voting of the badgeholders.
