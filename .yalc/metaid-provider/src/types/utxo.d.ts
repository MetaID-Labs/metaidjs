import { ApiBaseParams } from './common'
import { BaseApiConstructorParams } from '@/api/base'

export interface UtxoConstructorParams extends BaseApiConstructorParams {}

export interface UtxoItem {
  address: string
  // utxo 所在的路径
  addressIndex: number
  addressType: number
  // txIndex: number
  outputIndex: number
  txId: string
  // value: number
  script: string
  amount: number
  satoshis: number
}

export interface GetAllPrams extends ApiBaseParams {
  mixAmount?: number
}
