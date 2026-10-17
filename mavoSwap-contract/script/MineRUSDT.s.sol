// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";

contract MineRUSDT is Script {
    // HYPE token address on elysium is 
    function run() external {
        bytes32 salt = vm.envBytes32("RUSDT_SALT");

        vm.startBroadcast();

        MockERC20 rUSDT = new MockERC20{salt: salt}(
            "rUSDT",
            "rUSDT",
            6,
            10_000_000_000 * 10 ** 6,
            vm.envAddress("ADDRESS_TO_MINT_TO")
        );

        vm.stopBroadcast();

        console.log("rUSDT deployed at:", address(rUSDT));
    }

    // Run this offline first to find the salt:
    // forge script script/MineRUSDT.s.sol --sig "mine()" --rpc-url sepolia
    function mine() external view {
        address deployer = msg.sender;
        bytes32 initCodeHash = hashInitCode(
            type(MockERC20).creationCode,
            abi.encode(
                "rUSDT",
                "rUSDT",
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

            if (uint160(predicted) >> 152 == 0xaB) {
                console.log("Salt found:", vm.toString(salt));
                console.log("Address:  ", predicted);
                break;
            }
        }
    }
}