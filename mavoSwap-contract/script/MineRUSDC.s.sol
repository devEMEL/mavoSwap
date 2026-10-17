// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";

contract MineRUSDC is Script {
    // HYPE token address on elysium is 
    function run() external {
        bytes32 salt = vm.envBytes32("RUSDC_SALT");

        vm.startBroadcast();

        MockERC20 rUSDC = new MockERC20{salt: salt}(
            "rUSDC",
            "rUSDC",
            6,
            10_000_000_000 * 10 ** 6,
            vm.envAddress("ADDRESS_TO_MINT_TO")
        );

        vm.stopBroadcast();

        console.log("rUSDC deployed at:", address(rUSDC));
    }

    // Run this offline first to find the salt:
    // forge script script/MineRUSDC.s.sol --sig "mine()" --rpc-url sepolia
    function mine() external view {
        address deployer = msg.sender;
        bytes32 initCodeHash = hashInitCode(
            type(MockERC20).creationCode,
            abi.encode(
                "rUSDC",
                "rUSDC",
                uint8(6),
                uint256(10_000_000_000 * 10 ** 6),
                vm.envAddress("ADDRESS_TO_MINT_TO")
            )
        );

        console.log("Mining for 0x7D prefix...");
        console.log("Deployer:", deployer);

        for (uint256 i = 0; i < 10_000_000; i++) {
            bytes32 salt = bytes32(i);
            address predicted = vm.computeCreate2Address(salt, initCodeHash);

            if (uint160(predicted) >> 152 == 0x7D) {
                console.log("Salt found:", vm.toString(salt));
                console.log("Address:  ", predicted);
                break;
            }
        }
    }
}