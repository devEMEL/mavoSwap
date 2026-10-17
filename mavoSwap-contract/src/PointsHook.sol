// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "v4-hooks-public/lib/v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {SignedMath} from "@openzeppelin/contracts/utils/math/SignedMath.sol";
import {ERC1155} from "solmate/src/tokens/ERC1155.sol";

contract PointsHook is BaseHook, ERC1155 {
    using PoolIdLibrary for PoolKey;

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory)
    {
        return
            Hooks.Permissions({
                beforeInitialize: false,
                afterInitialize: false,
                beforeAddLiquidity: false,
                beforeRemoveLiquidity: false,
                afterAddLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: false,
                afterSwap: true,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: false,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            });
    }

    function _assignPoints(PoolId poolId, bytes calldata hookData, uint256 points) internal {
        if (hookData.length == 0) return;

        address user = abi.decode(hookData, (address));
        if (user == address(0)) return;

        uint256 tokenId = uint256(PoolId.unwrap(poolId));
        _mint(user, tokenId, points, "");
    }

    function _afterSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        BalanceDelta delta,
        bytes calldata hookData
    ) internal override returns (bytes4, int128) {
        uint256 pointsToMint =
            SignedMath.abs(delta.amount0() / 100) + SignedMath.abs(delta.amount1() / 100);

        _assignPoints(key.toId(), hookData, pointsToMint);

        return (this.afterSwap.selector, 0);
    }

    function uri(uint256) public pure override returns (string memory) {
        return "";
    }
}