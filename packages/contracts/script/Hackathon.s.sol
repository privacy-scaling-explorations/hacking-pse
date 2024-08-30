// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Script } from "forge-std/src/Script.sol";
import { console } from "forge-std/src/console.sol";
import { HatsExcubia } from "@zk-kit/excubiae/extensions/HatsExcubia.sol";
import { SemaphoreVerifier } from "@semaphore-protocol/contracts/base/SemaphoreVerifier.sol";
import { ISemaphoreVerifier } from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";
import { Semaphore } from "../src/Semaphore.sol";

contract DeploySemaphore_AndSetGate is Script {
    // @todo needs the correct HatsProtocol address.
    // See https://book.getfoundry.sh/tutorials/solidity-scripting for deploy.
    address public HATS_ADDRESS = vm.envAddress("HATS_ADDRESS");
    uint256[] public CRITERION_HATS = [vm.envUint("HAT_ID")];

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy HatsExcubia
        HatsExcubia hatsExcubia = new HatsExcubia(HATS_ADDRESS, CRITERION_HATS);
        console.log("HatsExcubia deployed to:", address(hatsExcubia));

        // Deploy SemaphoreVerifier
        SemaphoreVerifier semaphoreVerifier = new SemaphoreVerifier();
        console.log("SemaphoreVerifier deployed to:", address(semaphoreVerifier));

        // Deploy Semaphore
        Semaphore semaphore = new Semaphore(ISemaphoreVerifier(address(semaphoreVerifier)), hatsExcubia);
        console.log("Semaphore deployed to:", address(semaphore));

        hatsExcubia.setGate(address(semaphore));

        vm.stopBroadcast();
    }
}
