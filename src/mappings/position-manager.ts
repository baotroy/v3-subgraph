/* eslint-disable prefer-const */
import {
  Collect,
  DecreaseLiquidity,
  IncreaseLiquidity,
  NonfungiblePositionManager,
  Transfer
} from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import {  Position, PositionSnapshot } from '../types/schema'
import { ADDRESS_ZERO, factoryContract, ZERO_BD, ZERO_BI } from '../utils/constants'
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { convertTokenToDecimal, loadTransaction } from '../utils'

function getPosition(event: ethereum.Event, tokenId: BigInt): Position | null {
  let position = Position.load(tokenId.toString())
  if (position === null) {
    let contract = NonfungiblePositionManager.bind(event.address)
    let positionCall = contract.try_positions(tokenId)

    // the following call reverts in situations where the position is minted
    // and deleted in the same block - from my investigation this happens
    // in calls from  BancorSwap
    // (e.g. 0xf7867fa19aa65298fadb8d4f72d0daed5e836f3ba01f0b9b9631cdc6c36bed40)
    if (!positionCall.reverted) {
      position = new Position(tokenId.toString())
      // The owner gets correctly updated in the Transfer handler
      position.owner = Address.fromString(ADDRESS_ZERO)
    }
  }

  return position
}


function savePositionSnapshot(position: Position, event: ethereum.Event, hash: string, amount0: string, amount1: string): void {
  if (position.owner.toHexString()== ADDRESS_ZERO.toString()) {
    return
  }
  let positionSnapshot = new PositionSnapshot(position.id)
  positionSnapshot.owner = position.owner
  // positionSnapshot.pool = position.pool
  // positionSnapshot.position = position.id
  positionSnapshot.blockNumber = event.block.number
  positionSnapshot.timestamp = event.block.timestamp
  // positionSnapshot.liquidity = position.liquidity
  // positionSnapshot.depositedToken0 = position.depositedToken0
  // positionSnapshot.depositedToken1 = position.depositedToken1
  // positionSnapshot.withdrawnToken0 = position.withdrawnToken0
  // positionSnapshot.withdrawnToken1 = position.withdrawnToken1
  // positionSnapshot.collectedFeesToken0 = position.collectedFeesToken0
  // positionSnapshot.collectedFeesToken1 = position.collectedFeesToken1
  // positionSnapshot.hash =  event.transaction.hash.toString();
  // positionSnapshot.feeGrowthInside0LastX128 = position.feeGrowthInside0LastX128
  // positionSnapshot.feeGrowthInside1LastX128 = position.feeGrowthInside1LastX128
  positionSnapshot.amount0 = amount0;
  positionSnapshot.amount1 = amount1;
  positionSnapshot.hash = hash;
  positionSnapshot.save()
}

export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  // temp fix
  if (event.block.number.equals(BigInt.fromI32(14317993))) {
    return
  }

  let position = getPosition(event, event.params.tokenId)
  //
  // position was not able to be fetched
  if (position == null) {
    return
  }

  let existedPositionSnapshot = PositionSnapshot.load(position.id)

  if (existedPositionSnapshot != null) {
    return
  }
  //
  // // temp fix
  // if (Address.fromString(position.pool).equals(Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248'))) {
  //   return
  // }
  //
  // let token0 = Token.load(position.token0)
  // let token1 = Token.load(position.token1)
  //
  let amount0 = event.params.amount0.toString()
  let amount1 = event.params.amount1.toString()
  // position.amount0 = amount0.toString()
  // position.amount1 = amount1.toString()
  let hash =  event.transaction.hash.toHexString()
  //
  // position.liquidity = position.liquidity.plus(event.params.liquidity)
  // position.depositedToken0 = position.depositedToken0.plus(amount0)
  // position.depositedToken1 = position.depositedToken1.plus(amount1)
  //
  // updateFeeVars(position!, event, event.params.tokenId)
  //
  // position.save()
  // # NFT token id
  // id: ID!
  // # owner of the NFT
  // owner: Bytes!
  // # block in which the snap was created
  // blockNumber: BigInt!
  // # timestamp of block in which the snap was created
  // timestamp: BigInt!
  // # tx in which the snapshot was initialized
  // transaction: Transaction!
  // let positionSnapshot = new PositionSnapshot(event.params.tokenId)
  // positionSnapshot.owner = position.owner
  // positionSnapshot.blockNumber = event.block.number
  // positionSnapshot.timestamp = event.block.timestamp
  // positionSnapshot.transaction = loadTransaction(event).id
  // positionSnapshot.save()
  savePositionSnapshot(position!, event, hash, amount0, amount1)
}

// export function handleDecreaseLiquidity(event: DecreaseLiquidity): void {
//   // temp fix
//   if (event.block.number == BigInt.fromI32(14317993)) {
//     return
//   }
//
//   let position = getPosition(event, event.params.tokenId)
//
//   // position was not able to be fetched
//   if (position == null) {
//     return
//   }
//
//   // temp fix
//   if (Address.fromString(position.pool).equals(Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248'))) {
//     return
//   }
//
//   let token0 = Token.load(position.token0)
//   let token1 = Token.load(position.token1)
//   let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
//   let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
//
//   position.liquidity = position.liquidity.minus(event.params.liquidity)
//   position.withdrawnToken0 = position.withdrawnToken0.plus(amount0)
//   position.withdrawnToken1 = position.withdrawnToken1.plus(amount1)
//
//   position = updateFeeVars(position!, event, event.params.tokenId)
//   position.save()
//   savePositionSnapshot(position!, event)
// }

// export function handleCollect(event: Collect): void {
//   let position = getPosition(event, event.params.tokenId)
//   // position was not able to be fetched
//   if (position == null) {
//     return
//   }
//   if (Address.fromString(position.pool).equals(Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248'))) {
//     return
//   }
//
//   let token0 = Token.load(position.token0)
//   let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
//   position.collectedFeesToken0 = position.collectedFeesToken0.plus(amount0)
//   position.collectedFeesToken1 = position.collectedFeesToken1.plus(amount0)
//
//   position = updateFeeVars(position!, event, event.params.tokenId)
//   position.save()
//   savePositionSnapshot(position!, event)
// }

export function handleTransfer(event: Transfer): void {
  let position = getPosition(event, event.params.tokenId)

  // position was not able to be fetched
  if (position == null) {
    return
  }
  if (event.params.to.toHexString() == ADDRESS_ZERO) {
    return
  }
  position.owner = event.params.to
  position.save()

  // savePositionSnapshot(position!, event)
}
