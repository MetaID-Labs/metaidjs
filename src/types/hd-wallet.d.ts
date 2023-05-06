declare interface ProtocolBrfcNode {
  address: string;
  data: string;
  nodeName: string;
  parentPublicKey: string;
  parentTxId: string;
  publicKey: string;
  timestamp: number;
  txId: string;
  version: string;
  xpub: string;
  addressType: number;
  addressIndex: number;
}

declare interface UserProtocolBrfcNode extends ProtocolBrfcNode {
  nodeName: NodeName;
  brfcId: string;
}

declare interface NewNodeBaseInfo {
  address: string;
  path: string;
  publicKey: string;
}

declare interface OutputTypes {
  [k: string]: any;
  script: mvc.Script;
  satoshis: number;
}

declare interface CreateBrfcNodePrams {
  nodeName: NodeName;
  parentTxId: string;
  payTo?: { amount: number; address: string }[];
  utxos?: UtxoItem[];
  useFeeb?: number;
}

declare interface Reqswapargs {
  requestIndex: number;
  nftToAddress: string;
  mvcToAddress: string;
  txFee: number;
  feePerYear: number;
  op: number;
  nftCodeHash: string;
  nftGenesisID: string;
  nftTokenIndex: string;
}

declare interface MetaNameRequestDate {
  mvcRawTx?: string;
  requestIndex: string;
  mvcOutputIndex?: number;
  nftRawTx?: string;
  nftOutputIndex?: number;
  years?: number;
  infos?: {
    metaid?: string;
    mvc?: string;
    icon?: string;
    [key: string]: any;
  };
}

declare interface BaseUserInfoTypes {
  accessKey?: string;
  userType: string;
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  pk2: string;
  token?: string;
  enCryptedMnemonic?: string;
  tag?: "new" | "old";
  referrerId?: string;
  appToken?: string;
  ethAddress?: string;
  evmAddress?: string;
  path: number;
}

declare interface TransferNftParams {
  network?: string;
  feeb?: number;
  codehash: string;
  genesis: string;
  sensibleId: string;
  tokenIndex: string;
  receiverAddress: string;
  senderWif: string;
  opreturnData?: string;
  utxos?: any[];
  purseWif?: string;
}
declare interface PaytoTypes {
  address: string;
  amount: number;
}

declare interface NftTransferResult {
  txid: string;
  tx: mvc.Transaction;
  txHex: string;
}

declare interface OutputTypes {
  script: mvc.Script;
  satoshis: number;
}

declare interface PickUtxosResultTypes {
  isEnoughBalance: boolean;
  newPickedUtxos: MetasvUtxoTypes[];
}
declare interface KeyPathRelationType {
  keyPath: string;
  parentKeyPath: string;
}

declare interface KeyPathObjTypes {
  [key: string]: KeyPathRelationType;
}

declare interface MakeTxResultTypes {
  tx: mvc.Transaction;
  changeUtxo: MetasvUtxoTypes;
}
declare interface MetaIdInfoTypes {
  metaId: string;
  metaIdTag: string;
  infoTxId: string;
  protocolTxId: string;
  name?: string;
  phone?: string;
  email?: string;
  pubKey?: string;
}

declare interface CreateBrfcChildNodeRes {
  payTo: CreateNodeBaseRes | null;
  metaFileBrfc: CreateNodeBrfcRes | null;
  metaFiles: CreateNodeMetaFileRes[] | [];
  currentNodeBrfc: CreateNodeBrfcRes | null;
  currentNode: CreateNodeBaseRes | null;
}

declare interface NodeOptions {
  nodeName: string;
  version?: string;
  parentTxId?: string | null;
  encrypt?: number | string;
  metaIdTag?: string;
  appId?: string[];
  data?: string | Buffer;
  dataType?: string;
  keyPath?: string;
  parentAddress?: string;
  encoding?: string;
  limit?: number;
  payCurrency?: string;
  payTo?: any[];
  payAllAddress?: string;
  needConfirm?: boolean;
  utxos?: any[]; // 指定使用 UTXO 集
  ecdh?: any;
  attachmentsUseMetaSv?: boolean;
  uploadAddr?: boolean;
  parentKeyPath?: string;
  publicKey?: string;
  serviceAddress?: string;
  protocolType?: string;
  attachmentsServiceRate?: string;
  payAll?: boolean;
  privateKeyPath?: string;
  useFeeb?: number;
  externalUtxos?: any[];
  onlyUseExternalUtxos?: boolean;
}

declare interface ProtocolOptions extends NodeOptions {
  path: string;
  brfcId: string;
  useFeeb?: number;
  nodeKey?: string;
  autoRename?: boolean;
  useThird?: boolean;
  attachments?: AttachmentItem[];
  externalUtxos?: UtxoItem[];
}

declare interface NewNodeBaseInfo {
  address: string;
  path: string;
  publicKey: string;
}

declare interface NewBrfcNodeBaseInfo extends NewNodeBaseInfo {
  isUsed: boolean;
  parentTxId: string;
}
