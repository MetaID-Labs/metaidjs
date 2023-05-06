import { BaseApiConstructorParams } from "@/api/base";

export interface MetaIdConstructorParams extends BaseApiConstructorParams {}

export interface MetaIdUserInfo {
  metaId: string;
  metaIdTag: string;
  address: string;
  pubKey: string;
  infoTxId: string;
  protocolTxId: string;
  name: string;
  metaName: string;
  nameType: string;
  nftNamePublicKey: string;
  avatarTxId: string;
  avatarImage: string;
  avatarType: string;
  coverUrl: string;
  coverType: string;
  coverPublicKey: string;
  evmAddress?: {
    polygon?: string;
    evm?: string;
    eth?: string;
  };
  timestamp: number;
}

export interface AccountInfo {
  address: string;
  avatarTxId: string;
  avatarType: string;
  customizeAvatarTxId: string;
  email: string;
  emailEncrypt: string;
  headUrl: string;
  headUrlEncrypt: string;
  infoTxId: string;
  metaId: string;
  name: string;
  nameEncrypt: string;
  phone: string;
  phoneEncrypt: string;
  protocolTxId: string;
  pubKey: string;
  showId: string;
  timestamp: number;
  xpub: string;
}

export interface NewNodeBaseInfo {
  address: string;
  path: string;
  publicKey: string;
}

export interface MetaFileSha256Info {
  blockHeight: number;
  fileDataType: string;
  fileSize: number;
  fileSizeStr: string;
  fileType: number;
  hash: string;
  md5: string;
  metaId: string;
  metanetId: string;
  resUrl: string;
  timestamp: number;
  txId: string;
}

export interface MetafileBySha256 {
  total: number;
  nextFlag: string;
  results: {
    items: MetaFileSha256Info[] | null;
  };
}
