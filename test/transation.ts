declare interface BuildTxDataPramas {
  utxos?: any[];
  payTos: Array<{
    address: string;
    amount: number;
  }>;
  opData?: string;
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
  opData?: string;
}

class Transation {
  constructor() {}

  public build_tx_data(params: BuildTxDataPramas) {
    return params;
  }

  public build_meta_data(params: BuildMetaDataPramas) {
    console.log(params);
  }
}

export default Transation;
