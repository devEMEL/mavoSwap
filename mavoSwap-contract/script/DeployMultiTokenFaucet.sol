// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/MultiTokenFaucet.sol";

contract DeployFaucet is Script {
    function run() external {

        // --- Configure your 5 tokens here ---
        // Amounts are 500 tokens, scaled to each token's decimals
        address[] memory tokens = new address[](5);
        tokens[0] = 0x36bEE8F2DF69Cf3AFAb5c5ccA973fEb6441cAb11; // mUSDC (6 decimals)
        tokens[1] = 0xF351A424955ba04e3d49dDa6E549a5983dB264B9; // UNCX (18 decimals)
        tokens[2] = 0x68b6Bdb4AC1d0EBafe5D00309225998997d7137d; // FLUX (18 decimals)
        tokens[3] = 0x988A89F9469D3B2D7BDbd4Af2b4B39D61701F3eC; // HNY (18 decimals)
        tokens[4] = 0xd7569Bd95be12b864aAba642721D03063352c896; // ZIL (18 decimals)



        uint256[] memory amounts = new uint256[](5);
        amounts[0] = 500 * 10 ** 6;  // mUSDC: 500 * 10^6
        amounts[1] = 500 * 10 ** 18; // UNCX
        amounts[2] = 500 * 10 ** 18; // FLUX
        amounts[3] = 500 * 10 ** 18; // HNY
        amounts[4] = 500 * 10 ** 18; // ZIL

        vm.startBroadcast();

        MultiTokenFaucet faucet = new MultiTokenFaucet(tokens, amounts);

        // Set cooldown to 24 hours (adjust as needed)
        faucet.setCooldown(3 minutes);

        vm.stopBroadcast();

        console.log("MultiTokenFaucet deployed at:", address(faucet));
    }
}