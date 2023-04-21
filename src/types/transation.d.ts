declare interface BuildTxDataPramas {
  utxos?: any[];
  payTos: Array<{
    address: string;
    amount: number;
  }>;
  opData: string;
}

declare interface MetaData {
  nodeName: string;
  encrypt: 0 | 1;
  version: string;
  data: any;
  dataType: string;
  encoding: string;
}

declare interface BuildMetaDataPramas extends BuildTxDataPramas {
  metaData: MetaData;
  attachments: any[];
  needConfirm: boolean;
  publicKey: string;
  txId: string;
  opData: string;
}
