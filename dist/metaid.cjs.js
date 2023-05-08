'use strict';

var NodeName;
(function (NodeName) {
    NodeName["ETHBinding"] = "EVMBinding";
    NodeName["MetaFile"] = "MetaFile";
    NodeName["NFTAvatar"] = "NFTAvatar";
    NodeName["PayComment"] = "PayComment";
    NodeName["PayLike"] = "PayLike";
    NodeName["PayFollow"] = "PayFollow";
    NodeName["SimpleMicroblog"] = "SimpleMicroblog";
    NodeName["SimpleRePost"] = "SimpleRePost";
    NodeName["SimpleGroupChat"] = "SimpleGroupChat";
    NodeName["SimpleFileGroupChat"] = "SimpleFileGroupChat";
    NodeName["SimpleCommunity"] = "SimpleCommunity";
    NodeName["SimpleCommunityJoin"] = "SimpleCommunityJoin";
    NodeName["SimpleGroupCreate"] = "SimpleGroupCreate";
    NodeName["ShowMsg"] = "ShowMsg";
    NodeName["NftIssue"] = "NftIssue";
    NodeName["NftGenesis"] = "NftGenesis";
    NodeName["NftSell"] = "NftSell";
    NodeName["NftCancel"] = "NftCancel";
    NodeName["nftBuy"] = "nftBuy";
    NodeName["FtGenesis"] = "FtGenesis";
    NodeName["FtIssue"] = "FtIssue";
    NodeName["SimpleRedEnvelope"] = "SimpleRedEnvelope";
    NodeName["OpenRedenvelope"] = "OpenRedenvelope";
    NodeName["SimplePublicShare"] = "SimplePublicShare";
    NodeName["LegalSellNft"] = "sell_nft";
    NodeName["Name"] = "name";
    NodeName["MetaNote"] = "metanote";
    NodeName["SimpleFileMsg"] = "SimpleFileMsg";
    NodeName["SimpleCreateAnnouncement"] = "SimpleCreateAnnouncement";
    NodeName["SimpleAnnouncementQuote"] = "SimpleAnnouncementQuote";
    NodeName["SimpleDAOCreate"] = "SimpleDAOCreate";
    NodeName["NftName"] = "NftName";
    NodeName["NftTransfer"] = "NftTransfer";
    NodeName["SendMoney"] = "SendMoney";
    NodeName["Phone"] = "phone";
    NodeName["Email"] = "email";
    NodeName["ShareChatMessage"] = "ShareChatMessage";
    // DAO
})(NodeName || (NodeName = {}));
var SdkPayType;
(function (SdkPayType) {
    SdkPayType["SPACE"] = "SPACE";
    SdkPayType["BTC"] = "BTC";
    SdkPayType["ETH"] = "ETH";
})(SdkPayType || (SdkPayType = {}));
var IsEncrypt;
(function (IsEncrypt) {
    IsEncrypt[IsEncrypt["Yes"] = 1] = "Yes";
    IsEncrypt[IsEncrypt["No"] = 0] = "No";
})(IsEncrypt || (IsEncrypt = {}));
var HdWalletChain;
(function (HdWalletChain) {
    HdWalletChain["MVC"] = "mvc";
})(HdWalletChain || (HdWalletChain = {}));
var Network;
(function (Network) {
    Network["mainnet"] = "mainnet";
    Network["testnet"] = "testnet";
})(Network || (Network = {}));
var WalletPath;
(function (WalletPath) {
    WalletPath[WalletPath["mainnet"] = 10001] = "mainnet";
    WalletPath[WalletPath["testnet"] = 236] = "testnet";
})(WalletPath || (WalletPath = {}));
var JobStepStatus;
(function (JobStepStatus) {
    JobStepStatus["Waiting"] = "waiting";
    JobStepStatus["Success"] = "success";
    JobStepStatus["Failed"] = "failed";
})(JobStepStatus || (JobStepStatus = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["Waiting"] = "waiting";
    JobStatus["Success"] = "success";
    JobStatus["Failed"] = "failed";
})(JobStatus || (JobStatus = {}));
var MetaIdTag;
(function (MetaIdTag) {
    MetaIdTag["mainnet"] = "metaid";
    MetaIdTag["testnet"] = "testmetaid";
})(MetaIdTag || (MetaIdTag = {}));
var MetaNameOp;
(function (MetaNameOp) {
    MetaNameOp[MetaNameOp["register"] = 1] = "register";
    MetaNameOp[MetaNameOp["renew"] = 2] = "renew";
    MetaNameOp[MetaNameOp["updataInfo"] = 3] = "updataInfo";
})(MetaNameOp || (MetaNameOp = {}));
var MetaNameReqType;
(function (MetaNameReqType) {
    MetaNameReqType["register"] = "register";
    MetaNameReqType["renew"] = "renew";
    MetaNameReqType["updataInfo"] = "updateinfo";
})(MetaNameReqType || (MetaNameReqType = {}));
var MetaNameReqCode;
(function (MetaNameReqCode) {
    MetaNameReqCode[MetaNameReqCode["register"] = 1] = "register";
    MetaNameReqCode[MetaNameReqCode["renew"] = 21] = "renew";
    MetaNameReqCode[MetaNameReqCode["updataInfo"] = 22] = "updataInfo";
})(MetaNameReqCode || (MetaNameReqCode = {}));
var Chains;
(function (Chains) {
    Chains["MVC"] = "mvc";
    Chains["ETH"] = "eth";
})(Chains || (Chains = {}));
var MetaidTag;
(function (MetaidTag) {
    MetaidTag["test"] = "testmetaid";
    MetaidTag["main"] = "metaid";
})(MetaidTag || (MetaidTag = {}));

// import Transation from "@/transation/transation";
// test();
async function init() {
    try {
        console.log("123", 123);
        // const wallet = await hdWalletFromMnemonic(
        //   mnemonic,
        //   "new",
        //   Env.WalletNetWork,
        //   Env.WalletPath
        // );
        // const hdWallet = new HdWallet(wallet);
        // const metaIdInfo = await hdWallet.getMetaIdInfo(hdWallet.rootAddress);
        // const sdk = new SDK(Env.WalletNetWork);
        // await sdk.initWallet(hdWallet);
        // console.log("sdk", sdk);
        // const userInfo = {
        //   ...metaIdInfo,
        //   metaId: metaIdInfo.metaId,
        //   name: metaIdInfo.name,
        //   address: hdWallet.rootAddress,
        //   showWallet: sdk,
        //   loginType: "MetaID",
        // };
        // window.localStorage.setItem("userInfo", JSON.stringify(userInfo));
        // console.log(
        //   "userInfo",
        //   JSON.parse(window.localStorage.getItem("userInfo")!)
        // );
        // const Tx = new Transation(sdk);
        // const result = await Tx.build_meta_data({
        //   metaData: {
        //     nodeName: NodeName.SimpleMicroblog,
        //   },
        //   payTos: [],
        //   attachments: [],
        //   needConfirm: false,
        //   publicKey: userInfo.pubKey!,
        //   opData: "",
        //   txId: "",
        // });
        // const metaidjsSDK = new MetaIDSdk({
        //   network: Network.testnet,
        //   providerApi: {
        //     base: {
        //       network: Network.testnet,
        //       showMoneyBaseUrl: `https://testmvc.showmoney.app`,
        //       metaSvBaseUrl: `https://testmvc.showmoney.app/metasv`,
        //     },
        //   },
        // });
        // await metaidjsSDK.initWallet();
        // await metaidjsSDK.initMetaIdNode();
        //console.log("result", metaidjsSDK);
        return;
        const buzz = await metaidjsSDK.build_meta_data({
            metaData: {
                nodeName: NodeName.SimpleMicroblog,
            },
            payTos: [],
            attachments: [],
            needConfirm: false,
            publicKey: "",
            opData: "",
            txId: "",
        });
        console.log("buzz", buzz);
        // if (!metaIdInfo.metaId) {
        //   throw new Error(`metaid not exist`);
        // }
        // console.log("metaIdInfo", metaIdInfo);
    }
    catch (error) {
        console.log("error", error);
    }
}
//init();
// const tx = new Transation();
// tx.build_tx_data({
//   payTos: [
//     {
//       amount: 1000,
//       address: "12313",
//     },
//   ],
//   opData: "",
// });

exports.init = init;
//# sourceMappingURL=metaid.cjs.js.map
