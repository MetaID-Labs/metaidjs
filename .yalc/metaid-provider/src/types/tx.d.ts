import { BaseApiConstructorParams } from "@/api/base";

export interface TxConstructorParams extends BaseApiConstructorParams {}

export interface BrfcInfoItem {
  address: string;
  chain: string;
  data: string;
  nodeName: string;
  parentPublicKey: string;
  parentTxId: string;
  publicKey: string;
  timestamp: number;
  txId: string;
  version: string;
}

export interface TxInfo {
  metanetId: string;
  parentAddress: string;
  parentTxId: string;
  parentData: string;
  publicKey: string;
  txId: string;
}
