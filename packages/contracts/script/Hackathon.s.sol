// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import { Script } from "forge-std/src/Script.sol";
import { console } from "forge-std/src/console.sol";
import { HatsExcubia } from "@zk-kit/excubiae/extensions/HatsExcubia.sol";
import { SemaphoreVerifier } from "@semaphore-protocol/contracts/base/SemaphoreVerifier.sol";
import { ISemaphoreVerifier } from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";
import { Semaphore } from "../src/Semaphore.sol";

contract Deploy is Script {
    // @todo needs the correct HatsProtocol address.
    // See https://book.getfoundry.sh/tutorials/solidity-scripting for deploy.
    address public HATS_ADDRESS = address(0x3bc1A0Ad72417f2d411118085256fC53CBdDd137);
    uint256[] public CRITERION_HATS = [0, 1, 2];

    function run() external {
        // @todo uncomment this.
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        // vm.startBroadcast();

        // Deploy HatsExcubia
        HatsExcubia hatsExcubia = new HatsExcubia(HATS_ADDRESS, CRITERION_HATS);
        console.log("HatsExcubia deployed to:", address(hatsExcubia));

        // Deploy SemaphoreVerifier
        SemaphoreVerifier semaphoreVerifier = new SemaphoreVerifier();
        console.log("SemaphoreVerifier deployed to:", address(semaphoreVerifier));

        // Deploy Semaphore
        Semaphore semaphore = new Semaphore(ISemaphoreVerifier(address(semaphoreVerifier)), hatsExcubia);
        console.log("Semaphore deployed to:", address(semaphore));

        vm.stopBroadcast();
    }
}
