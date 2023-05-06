import Address from '@/api/address'
import MetaId from '@/api/metaid'
import Tx from '@/api/tx'
import Utxo from '@/api/utxo'
import Xpub from '@/api/xpub'
import { BaseApiConstructorParams } from './api/base'

class MetaIdProvider {
  address
  metaId
  tx
  utxo
  xpub
  constructor(params: BaseApiConstructorParams) {
    this.address = new Address(params)
    this.metaId = new MetaId(params)
    this.tx = new Tx(params)
    this.utxo = new Utxo(params)
    this.xpub = new Xpub(params)
  }
}

export { MetaIdProvider, Address, MetaId, Tx, Utxo, Xpub }
