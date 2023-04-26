declare interface MetaIdJsRes {
  code: number;
  data: any;
  status?: string;
  handlerId?: string;
  appAccessToken?: string;
}

declare interface CreateNodeBaseRes {
  txId: string;
  transaction?: bsv.Transaction;
  scriptPlayload?: (string | Buffer)[];
  hex?: string;
  utxo?: UtxoItem;
}

declare interface CreateNodeMetaFileRes extends CreateNodeBaseRes {
  sha256: string;
}

declare interface CreateNodeBrfcRes extends CreateNodeBaseRes {
  address: string;
  addressType: number;
  addressIndex: number;
}

declare interface MetaData {
  nodeName: NodeName;
  encrypt?: IsEncrypt;
  version?: string;
  data?: string;
  dataType?: string;
  encoding?: string;
}

declare interface PayToItem {
  address: string;
  amount: number;
}

declare enum IsEncrypt {
  Yes = 1,
  No = 0,
}

declare interface AttachmentItem {
  fileName: string;
  fileType: string;
  data: string;
  encrypt: IsEncrypt;
  sha256: string;
  size: number;
  url: string;
}

declare interface UtxoItem {
  address: string;
  // utxo 所在的路径
  addressIndex: number;
  addressType: number;
  // txIndex: number
  outputIndex: number;
  txId: string;
  // value: number
  xpub?: string;
  script: string;
  amount: number;
  satoshis: number;
  wif?: string; // nft需要
}

declare interface NodeTransactions {
  payToAddress?: CreateNodeBaseRes;
  metaFileBrfc?: CreateNodeBrfcRes;
  metaFiles?: CreateNodeMetaFileRes[];
  currentNodeBrfc?: CreateNodeBrfcRes;
  currentNode?: CreateNodeBaseRes;
  sendMoney?: CreateNodeBaseRes;
  subscribeId?: string;
  nft?: {
    issue?: {
      transaction: mvc.Transaction;
      txId: string;
      tokenIndex: string;
    };
    genesis?: {
      transaction: mvc.Transaction;
      genesis: string;
      codehash: string;
      sensibleId: string;
      txId: string;
    };
    transfer?: {
      transaction: mvc.Transaction;
      txId: string;
    };
    sell?: {
      sellTransaction: mvc.Transaction;
      sellTxId: string;
      transaction: string;
      txId: string;
    };
    cancel?: {
      unlockCheckTransaction: mvc.Transaction;
      unlockCheckTxId: string;
      transaction: mvc.Transaction;
      txId: string;
    };
    buy?: {
      unlockCheckTransaction: mvc.Transaction;
      unlockCheckTxId: string;
      transaction: mvc.Transaction;
      txId: string;
    };
  };
  ft?: {
    issue?: {
      transaction: mvc.Transaction;
      txId: string;
      tokenIndex: string;
    };
    genesis?: {
      transaction: mvc.Transaction;
      genesis: string;
      codehash: string;
      sensibleId: string;
      txId: string;
    };
    transfer?: {
      transaction: mvc.Transaction;
      txId: string;
    };
  };
}

declare interface createBrfcChildNodeParams {
  autoRename?: boolean;
  nodeName: NodeName;
  encrypt?: IsEncrypt;
  version?: string;
  data?: string;
  dataType?: string;
  encoding?: string;
  appId?: string[];
  payCurrency?: string;
  payTos?: PayToItem[];
  needConfirm?: boolean; // 是否需要确认
  attachments?: AttachmentItem[]; // 附件
  utxos?: any[]; // 传入的utxos
  ecdh?: { type: string; publickey: string }; // ecdh
  useFeeb?: number; // 费率
  // 修改
  publickey?: string; // 修改时 用的publicekey
  txId?: string;
}

declare interface HdWalletCreateBrfcChildNodeParams
  extends createBrfcChildNodeParams {
  brfcTxId: string;
}

declare interface CreateBrfcNodeParams {
  nodeName: NodeName;
  parentTxId: string;
  payTo?: { amount: number; address: string }[];
  utxos?: UtxoItem[];
  useFeeb?: number;
}

declare interface JobStep {
  txId?: string;
  txHex: string;
  status: JobStepStatus;
  resultTxId?: string;
  resultTxMessage?: string;
  metanetId?: string;
}

declare interface Job {
  id: string;
  name: string;
  steps: JobStep[];
  status: JobStatus;
}

declare interface JobType {
  jobsQueue: Job[]; // 任务队列
  waitingNotify: Job[]; // 已上报，等待结果的任务
  done: Job[]; // 已完成的任务
  failed: Job[]; // 失败的任务
  isRunning: boolean;
  isPlayingNotice: boolean;
}

interface CreateNodeOptions {
  nodeName: string;
  metaIdTag?: string;
  data?: string | Buffer;
  parentTxId?: string;
  outputs?: any[];
  change?: string;
  utxos?: UtxoItem[];
  payTo?: PayToItem[];
  encrypt?: IsEncrypt;
  version?: string;
  dataType?: string;
  encoding?: string;
  node?: {
    // 创建新节点的信息， 当创建bfrc节点时需要传， 创建bfrc 子节点时不用传，自动生成
    address: string;
    publicKey: string;
    path: string;
  };
  chain?: HdWalletChain;
}

declare interface PaytoTypes {
  address: string;
  amount: number;
}

declare interface BaseUtxo {
  txId: string;
  outputIndex: number;
  satoshis: number;
  amount: number;
  address: string;
  script: string;
  addressType?: number;
  addressIndex?: number;
}

declare interface MetasvUtxoTypes extends BaseUtxo {
  xpub: string;
  txid: string;
  txIndex: number;
  value: number;
  height?: number;
  isSpend?: boolean;
  isLocal?: boolean;
  spentTxId?: string | null;
  flag?: string | null;
}

declare interface TransferTypes {
  amount?: number;
  to?: string;
  payCurrency?: string;
  outputs?: UtxoItem[];
  payTo?: PaytoTypes | PaytoTypes[];
  from?: BaseUtxo[];
  change?: string;
  utxos?: MetasvUtxoTypes[];
  opReturn?: (string | Buffer)[];
  needConfirm?: boolean;
  useFeeb?: number;
  chain?: HdWalletChain;
}
