// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";

contract MineRHYPE is Script {
    // HYPE token address on elysium is 
    function run() external {
        bytes32 salt = vm.envBytes32("RHYPE_SALT");

        vm.startBroadcast();

        MockERC20 rHYPE = new MockERC20{salt: salt}(
            "rHYPE",
            "rHYPE",
            18,
            10_000_000_000 * 10 ** 18,
            vm.envAddress("ADDRESS_TO_MINT_TO")
        );

        vm.stopBroadcast();

        console.log("rHYPE deployed at:", address(rHYPE));
    }

    // Run this offline first to find the salt:
    // forge script script/MineRHYPE.s.sol --sig "mine()" --rpc-url sepolia
    function mine() external view {
        address deployer = msg.sender;
        bytes32 initCodeHash = hashInitCode(
            type(MockERC20).creationCode,
            abi.encode(
                "rHYPE",
                "rHYPE",
                uint8(18),
                uint256(10_000_000_000 * 10 ** 18),
                vm.envAddress("ADDRESS_TO_MINT_TO")
            )
        );

        console.log("Mining for 0x00 prefix...");
        console.log("Deployer:", deployer);

        for (uint256 i = 0; i < 10_000_000; i++) {
            bytes32 salt = bytes32(i);
            address predicted = vm.computeCreate2Address(salt, initCodeHash);

            if (uint160(predicted) >> 152 == 0x00) {
                console.log("Salt found:", vm.toString(salt));
                console.log("Address:  ", predicted);
                break;
            }
        }
    }
}