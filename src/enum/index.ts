export enum NodeName {
  ETHBinding = "EVMBinding",
  MetaFile = "MetaFile",
  NFTAvatar = "NFTAvatar",
  PayComment = "PayComment",
  PayLike = "PayLike",
  PayFollow = "PayFollow",
  SimpleMicroblog = "SimpleMicroblog",
  SimpleRePost = "SimpleRePost",
  SimpleGroupChat = "SimpleGroupChat",
  SimpleFileGroupChat = "SimpleFileGroupChat",
  SimpleCommunity = "SimpleCommunity",
  SimpleCommunityJoin = "SimpleCommunityJoin",
  SimpleGroupCreate = "SimpleGroupCreate",
  ShowMsg = "ShowMsg",
  NftIssue = "NftIssue",
  NftGenesis = "NftGenesis",
  NftSell = "NftSell",
  NftCancel = "NftCancel",
  nftBuy = "nftBuy",
  FtGenesis = "FtGenesis",
  FtIssue = "FtIssue",
  SimpleRedEnvelope = "SimpleRedEnvelope",
  OpenRedenvelope = "OpenRedenvelope",
  SimplePublicShare = "SimplePublicShare",
  LegalSellNft = "sell_nft",
  Name = "name",
  MetaNote = "metanote",
  SimpleFileMsg = "SimpleFileMsg",
  SimpleCreateAnnouncement = "SimpleCreateAnnouncement",
  SimpleAnnouncementQuote = "SimpleAnnouncementQuote",
  SimpleDAOCreate = "SimpleDAOCreate",
  NftName = "NftName",
  NftTransfer = "NftTransfer",
  SendMoney = "SendMoney",
  Phone = "phone",
  Email = "email",
  ShareChatMessage = "ShareChatMessage",
  // DAO
}

export enum SdkPayType {
  SPACE = "SPACE",
  BTC = "BTC",
  ETH = "ETH",
}

export enum IsEncrypt {
  Yes = 1,
  No = 0,
}

export enum HdWalletChain {
  MVC = "mvc",
}

export enum Network {
  mainnet = "mainnet",
  testnet = "testnet",
}

export enum WalletPath {
  mainnet = 10001,
  testnet = 236,
}

export enum JobStepStatus {
  Waiting = "waiting",
  Success = "success",
  Failed = "failed",
}

export enum JobStatus {
  Waiting = "waiting",
  Success = "success",
  Failed = "failed",
}

export enum MetaIdTag {
  mainnet = "metaid",
  testnet = "testmetaid",
}

export enum MetaNameOp {
  register = 1,
  renew = 2,
  updataInfo = 3,
}

export enum MetaNameReqType {
  register = "register",
  renew = "renew",
  updataInfo = "updateinfo",
}

export enum MetaNameReqCode {
  register = 1,
  renew = 21,
  updataInfo = 22,
}

export enum Chains {
  MVC = "mvc",
  ETH = "eth",
}

export enum MetaidTag {
  test = "testmetaid",
  main = "metaid",
}
