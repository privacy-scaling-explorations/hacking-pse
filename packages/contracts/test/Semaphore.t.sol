// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "forge-std/src/Test.sol";

import { Semaphore } from "../src/Semaphore.sol";
import { SemaphoreVerifier } from "@semaphore-protocol/contracts/base/SemaphoreVerifier.sol";
import { IExcubia } from "@zk-kit/excubiae/IExcubia.sol";
import { ISemaphoreVerifier } from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";

contract MockExcubia  {
    constructor() {}
    function pass(address, bytes calldata) external {}
}

contract SemaphoreTest is Test {
    Semaphore semaphore;

    function setUp() public {
        // Deploy SemaphoreVerifier
        SemaphoreVerifier semaphoreVerifier = new SemaphoreVerifier();
        MockExcubia mockExcubia = new MockExcubia();
        semaphore = new Semaphore(ISemaphoreVerifier(address(semaphoreVerifier)), IExcubia(address(mockExcubia)));
    }

    function test_gate_and_add_member_with_different_address() public {
        semaphore.gateAndAddMember(1, "0x");

        vm.prank(address(1));
        semaphore.gateAndAddMember(2, "0x");
        vm.stopPrank();
    }
}
