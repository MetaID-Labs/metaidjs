declare interface apiResponse {
  code: number;
  msg: string;
  count: number;
  data: any;
  error?: string;
}

declare interface UserAllInfo {
  metaId: string;
  metaIdTag: string;
  address: string;
  pubKey: string;
  infoTxId: string;
  infoPublicKey: string;
  protocolTxId: string;
  protocolPublicKey: string;
  name: string;
  nameEncrypt: string;
  phone: string;
  phoneEncrypt: string;
  email: string;
  emailEncrypt: string;
  avatarTxId: string;
  avatarImage: string;
  avatarEncrypt: string;
  coverUrl: string;
  coverType: string;
  coverPublicKey: string;
  timestamp: number;
  metaName: string;
  nameType: string;
}

declare interface MetaFileSha256Info {
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
