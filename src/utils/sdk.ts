import { v1 as UUID } from "uuid";
import AllNodeName from "./AllNodeName";
import { GetMetafileBySha256 } from "@/api/api";

import { GetTx } from "@/api/metaid-base";
import { Transaction } from "dexie";
import HdWallet from "@/utils/wallet/hd-wallet";
import {
  SdkPayType,
  HdWalletChain,
  Network,
  JobStepStatus,
  JobStatus,
  NodeName,
} from "@/enum";
// @ts-ignore
import mvc from "mvc-lib";
//import { mvc } from "meta-contract";
export const DEFAULTS = {
  feeb: 1,
  minAmount: 546,
};

export const DUST_AMOUNT = 546;

export class SDK {
  bfrcNodeList: { nodeName: NodeName; data: CreateNodeBrfcRes }[] = []; // 存储Brfc节点， 防止未广播时重复构建
  metaFileSha256TxIdList: { sha256: string; txId: string }[] = []; // 存储metaFileSha256TxId， 防止未广播时重复构建
  network = Network.testnet;
  globalJob: any[] = [];
  isInitSdked: boolean = false;
  wallet: HdWallet | null = null;
  transactionsNFTKey = {
    [NodeName.NftGenesis]: "genesis",
    [NodeName.NftTransfer]: "transfer",
    [NodeName.NftSell]: "sell",
    [NodeName.NftCancel]: "cancel",
    [NodeName.nftBuy]: "buy",
  };

  constructor(network: any) {
    this.network = network;
  }

  get UserStore() {
    return JSON.parse(window.localStorage.getItem("userInfo")!) || null;
  }

  createBrfcChildNode(
    params: createBrfcChildNodeParams,
    option?: {
      isBroadcast?: boolean;
      payType?: SdkPayType;
      useQueue?: boolean;
      subscribeId?: string;
      checkOnly?: boolean; //false弹窗，true不弹窗
    }
  ) {
    return new Promise<NodeTransactions | null>(async (resolve, reject) => {
      const initOption = {
        isBroadcast: true,
        payType: SdkPayType.SPACE,
        useQueue: false,
        subscribeId: "",
      };
      const initParams = {
        appId: [],
        autoRename: true,
        version: "0.0.9",
        data: "NULL",
        dataType: "application/json",
        encoding: "UTF-8",
        payTo: [],
        attachments: [],
        utxos: [],
        useFeeb: DEFAULTS.feeb,
      };
      params = {
        ...initParams,
        ...params,
      };
      const subscribeId =
        option?.subscribeId || (option?.useQueue ? UUID() : "");
      option = {
        ...initOption,
        ...option,
        subscribeId,
      };
      if (params.payTos && params.payTos.length) {
        params.payTos = params.payTos.filter((item) => item.amount);
      }
      try {
        // 构建没有utxo 的所有 transaction

        let transactions = await this.createBrfcChildNodeTransactions(params);

        let payToRes: CreateNodeBaseRes | undefined = undefined;
        if (!params.utxos!.length) {
          // 计算总价
          let totalAmount = this.getNodeTransactionsAmount(
            transactions,
            params.payTos
          );

          const useSatoshis = totalAmount;

          //  获取余额
          const balance = await this.getBalance(option.payType!);
          // 等待 确认支付
          // const result = await this.awitSdkPayconfirm(
          //   option.payType!,
          //   totalAmount,
          //   balance!,
          //   option.checkOnly
          // );
          if (true) {
            // 确认支付
            // 打钱地址
            let receive = this.getNodeTransactionsFirstReceive(
              transactions,
              params
            );
            // 获取上链时的utxo
            const getUtxoRes = await this.getAmountUxto({
              sdkPayType: option.payType!,
              amount: useSatoshis,
              nodeName: params.nodeName,
              receive,
            });

            const currentUtxo = getUtxoRes.utxo;
            if (getUtxoRes.payToRes) {
              payToRes = getUtxoRes.payToRes;
            }

            // 使用utxo 组装 新的transactions
            transactions = await this.setUtxoForCreateChileNodeTransactions(
              transactions,
              currentUtxo!,
              params,
              (option.payType = this.wallet!.rootAddress)
            );
            // 广播
            if (option.isBroadcast && !option.useQueue) {
              // 广播 打钱操作
              if (payToRes && payToRes.transaction) {
                await this.wallet?.provider.broadcast(
                  payToRes.transaction.toString()
                );
              }
              // 广播 transactions 所有交易
              await this.broadcastNodeTransactions(transactions);
            }

            // 如果使用队列，则不进行广播，而是收集当次Job的所有交易作为step，推进队列
            if (option.useQueue) {
              this.convertTransactionsIntoJob(
                transactions,
                payToRes,
                option!.subscribeId!
              );
            }

            resolve({
              payToAddress: payToRes,
              ...transactions,
              subscribeId: option!.subscribeId,
            });
          } else {
            resolve(null);
          }
        } else {
          // 默认有 UTXO 不弹窗
          // 广播
          if (option.isBroadcast) {
            // 广播 transactions 所有交易
            await this.broadcastNodeTransactions(transactions);
          }

          resolve({
            payToAddress: payToRes,
            ...transactions,
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  getPathPrivateKey(path: string) {
    return this.wallet?.getPathPrivateKey(path);
  }

  initWallet(wallet: HdWallet) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.wallet = wallet;
        this.isInitSdked = true;
        resolve();
      } catch (error) {
        console.error(error);
        reject(new Error("生成钱包失败" + (error as any).message));
      }
    });
  }

  private awitSdkPayconfirm(
    payType: SdkPayType,
    useAmount: number,
    balance: number,
    checkOnly: boolean = false
  ) {
    return new Promise<boolean>((resolve, reject) => {
      if (checkOnly) {
        resolve(true);
      } else {
      }
    });
  }

  private createBrfcChildNodeTransactions(params: createBrfcChildNodeParams) {
    return new Promise<NodeTransactions>(async (resolve, reject) => {
      try {
        const chain = HdWalletChain.MVC;
        let transactions: NodeTransactions = {};
        if (params.nodeName === NodeName.SendMoney) {
          // 只转钱
          const scriptPlayload: string[] = [];
          const tx = await this.wallet?.makeTx({
            payTo: params.payTos,
            opReturn: [],
            utxos: params.utxos,
            chain: chain,
          });
          if (tx) {
            transactions.sendMoney = {
              txId: tx.id,
              transaction: tx,
              scriptPlayload: scriptPlayload,
            };
          }
        } else if (this.isInfoNode(params.nodeName)) {
          // 非 Protocols 节点
          const res = await this.wallet?.createNode({
            ...params,
            parentTxId: this.UserStore.infoTxId,
            chain,
          });
          transactions.currentNode = res;
        } else {
          // Protocols 节点

          // 如果有附件
          if (params.attachments && params.attachments!.length > 0) {
            transactions.metaFileBrfc = await this.getBrfcNode(
              {
                nodeName: NodeName.MetaFile,
                parentTxId: this.UserStore.protocolTxId!,
                utxos: [],
                useFeeb: params.useFeeb,
              },
              {
                isBroadcast: false,
                chain,
              }
            );
            transactions.metaFiles = await this.createMetaFilesTransactions(
              transactions.metaFileBrfc!.txId,
              params.attachments,
              chain
            );
          }

          //  处理当前节点
          if (params.nodeName !== NodeName.MetaFile) {
            // 当前节点的brfc 节点
            if (params.publickey && params.txId) {
              // 修改
              const res = await GetTx(params.txId);
              if (res.code === 0) {
                const protocol = await this.wallet!.getProtocolInfo(
                  params.nodeName,
                  res.data.parentTxId,
                  res.data.parentData,
                  chain
                );
                transactions.currentNodeBrfc = {
                  address: res.data.parentAddress,
                  txId: res.data.parentTxId,
                  addressType: protocol!.addressType,
                  addressIndex: protocol!.addressIndex,
                };
              }
            } else {
              // 新增
              transactions.currentNodeBrfc = await this.getBrfcNode(
                {
                  nodeName: params.nodeName,
                  parentTxId: this.UserStore.protocolTxId!,
                  utxos: params.utxos,
                  useFeeb: params.useFeeb,
                },
                { isBroadcast: false, chain }
              );
            }

            const createCurrentNodeParams = {
              ...params,
              publickey: params.publickey,
              brfcTxId: transactions.currentNodeBrfc!.txId,
              ...AllNodeName[params.nodeName as NodeName]!,
            };

            if (
              params.nodeName === NodeName.NftTransfer ||
              params.nodeName === NodeName.NftSell ||
              params.nodeName === NodeName.NftCancel ||
              params.nodeName === NodeName.nftBuy ||
              params.nodeName === NodeName.NftGenesis
            ) {
              // NFT genesis/transfer
              if (!transactions.nft) transactions.nft = {};

              const scriptPlayload = await this.getScriptPlayload(
                createCurrentNodeParams,
                chain
              );
              let _params = {
                opreturnData: scriptPlayload!,
                utxoMaxCount: 1,
              };
              _params = {
                ..._params,
                ...JSON.parse(params.data!),
              };
              const nftManager = this.wallet!.getNftManager();
              const NFTGetFeeFunctionName = {
                [NodeName.NftGenesis]: "getGenesisEstimateFee",
                [NodeName.NftTransfer]: "getTransferEstimateFee",
                [NodeName.NftSell]: "getSellEstimateFee",
                [NodeName.NftCancel]: "getCancelSellEstimateFee",
                [NodeName.nftBuy]: "getBuyEstimateFee",
              };
              // @ts-ignore
              const feeNumber = await nftManager[
                NFTGetFeeFunctionName[params.nodeName]
              ](_params);
              // @ts-ignore
              const res = {
                txId: "",
                transaction: {
                  getNeedFee: () => {
                    return feeNumber;
                  },
                },
                scriptPlayload: [],
              };

              // @ts-ignore
              transactions.nft![this.transactionsNFTKey[params.nodeName]] = res;
            } else {
              //  transactions.currentNode
              transactions.currentNode = await this.wallet?.createBrfcChildNode(
                createCurrentNodeParams,
                {
                  isBroadcast: false,
                  chain,
                }
              );
              // nft issue
              if (params.nodeName === NodeName.NftIssue) {
                const data = JSON.parse(params.data!);
                const nftManager = this.wallet!.getNftManager();
                const response = await nftManager!.mint({
                  sensibleId: data.sensibleId,
                  metaTxId: transactions.currentNode!.txId,
                  noBroadcast: true,
                  metaOutputIndex: 0,
                  calcFee: true,
                });
                if (response) {
                  if (!transactions.nft) transactions.nft = {};
                  transactions.nft!.issue = {
                    txId: "",
                    transaction: {
                      // @ts-ignore
                      getNeedFee: () => {
                        return response.fee;
                      },
                    },
                    tokenIndex: "0",
                  };
                }
              }
            }
          }
        }
        resolve(transactions);
      } catch (error) {
        reject(error);
      }
    });
  }

  private createMetaFilesTransactions(
    metaFileBrfcTxId: string,
    attachments: AttachmentItem[] = [],
    chain: HdWalletChain
  ) {
    return new Promise<CreateNodeMetaFileRes[]>(async (resolve, reject) => {
      const transactions: CreateNodeMetaFileRes[] = [];
      let err;
      for (const item of attachments!) {
        try {
          if (
            this.metaFileSha256TxIdList.some(
              (_item) => _item.sha256 === item.sha256
            )
          ) {
            // 本地有缓存
            transactions.push({
              txId: this.metaFileSha256TxIdList.find(
                (_item) => _item.sha256 === item.sha256
              )!.txId,
              sha256: item.sha256,
            });
          } else {
            // 本地没有缓存
            const response = await GetMetafileBySha256({ sha256: item.sha256 });
            if (
              response.code === 0 &&
              response.data.results.items &&
              response.data.results.items.length
            ) {
              // 链上有
              transactions.push({
                txId: response.data.results.items[0].txId,
                sha256: item.sha256,
              });
              // 缓存到本地
              this.metaFileSha256TxIdList.push({
                sha256: item.sha256,
                txId: response.data.results.items[0].txId,
              });
            } else {
              // 本地 和 链上 都没有
              const res = await this.wallet?.createNode({
                nodeName: item.fileName,
                metaIdTag: "testmetaid",
                encrypt: item.encrypt,
                data: item.data,
                dataType: item.fileType,
                encoding: "binary",
                parentTxId: metaFileBrfcTxId,
                chain,
              });
              if (res) {
                this.metaFileSha256TxIdList.push({
                  sha256: item.sha256,
                  txId: res.txId,
                });
                transactions.push({
                  ...res,
                  sha256: item.sha256,
                });
              }
            }
          }
        } catch (error) {
          err = error;
        }
        if (err) {
          break;
        }
      }
      if (err) {
        reject(err);
      } else {
        resolve(transactions);
      }
    });
  }

  private getNodeTransactionsAmount(
    transactions: NodeTransactions,
    payTo: PayToItem[] = []
  ) {
    let amount = 0;
    // 计算总价
    // metafile brfc 节点价格
    if (transactions.sendMoney?.transaction) {
      amount += DUST_AMOUNT + DUST_AMOUNT;
    }
    if (transactions.metaFileBrfc?.transaction)
      amount += transactions.metaFileBrfc.transaction.getNeedFee();
    // metafile 节点价格
    if (transactions.metaFiles && transactions.metaFiles.length > 0) {
      for (const item of transactions.metaFiles.filter(
        (item) => item.transaction
      )) {
        amount += item.transaction.getNeedFee();
      }
    }
    // brfc 节点价格
    if (transactions.currentNodeBrfc?.transaction)
      amount += transactions.currentNodeBrfc.transaction.getNeedFee();
    // 节点价格
    if (transactions.currentNode?.transaction)
      amount += transactions.currentNode.transaction.getNeedFee();

    if (transactions.nft) {
      for (let i in transactions.nft) {
        // @ts-ignore
        amount += transactions.nft[i].transaction.getNeedFee();
      }
    }

    if (transactions.ft) {
      for (let i in transactions.ft) {
        // @ts-ignore
        amount += transactions.ft[i].transaction.getNeedFee();
      }
    }
    // payTo 价格
    if (payTo && payTo.length > 0) {
      for (const item of payTo) {
        amount += item.amount;
      }
    }
    return amount;
  }

  private getBalance(type: SdkPayType) {
    return new Promise<number>(async (resolve, reject) => {
      try {
        let balance = 0;
        if (type === SdkPayType.SPACE) {
          // 获取余额
          const res = await this.wallet?.provider.getXpubBalance(
            this.wallet.wallet.xpubkey.toString()
          );
          if (typeof res === "number") balance = res;
        }
        resolve(balance);
      } catch (error) {
        reject(error);
      }
    });
  }

  private getNodeTransactionsFirstReceive(
    transactions: NodeTransactions,
    params: createBrfcChildNodeParams
  ) {
    let receive: {
      address: string;
      addressIndex: number;
      addressType: number;
    };
    if (this.isInfoNode(NodeName.Name)) {
      receive = {
        address: this.wallet!.infoAddress,
        addressType: parseInt(
          this.wallet!.keyPathMap["Info"].keyPath.split("/")[0]
        ),
        addressIndex: parseInt(
          this.wallet!.keyPathMap["Info"].keyPath.split("/")[1]
        ),
      };
    }
    if (transactions.sendMoney?.transaction) {
      receive = {
        address: this.wallet!.rootAddress,
        addressType: parseInt(
          this.wallet!.keyPathMap["Protocols"].keyPath.split("/")[0]
        ),
        addressIndex: parseInt(
          this.wallet!.keyPathMap["Protocols"].keyPath.split("/")[0]
        ),
      };
    } else if (transactions.metaFileBrfc?.transaction) {
      // 需要创建 metafile brfc 节点 ，把钱打去 protocol 地址
      receive = {
        address: this.wallet!.protocolAddress,
        addressType: parseInt(
          this.wallet!.keyPathMap["Protocols"].keyPath.split("/")[0]
        ),
        addressIndex: parseInt(
          this.wallet!.keyPathMap["Protocols"].keyPath.split("/")[1]
        ),
      };
    } else if (
      transactions.metaFiles &&
      transactions.metaFiles.filter((item) => item.transaction).length
    ) {
      // 需要创建 metafile 节点 ，把钱打去 metafile brfc 地址
      receive = {
        address: transactions.metaFileBrfc!.address,
        addressType: transactions.metaFileBrfc!.addressType,
        addressIndex: transactions.metaFileBrfc!.addressIndex,
      };
    } else if (transactions.currentNodeBrfc?.transaction) {
      // 需要创建 brfc 节点 ，把钱打去 protocol 地址
      receive = {
        address: this.wallet!.protocolAddress,
        addressType: parseInt(
          this.wallet!.keyPathMap["Protocols"].keyPath.split("/")[0]
        ),
        addressIndex: parseInt(
          this.wallet!.keyPathMap["Protocols"].keyPath.split("/")[1]
        ),
      };
    } else {
      receive = {
        address: transactions.currentNodeBrfc!.address,
        addressType: transactions.currentNodeBrfc!.addressType,
        addressIndex: transactions.currentNodeBrfc!.addressIndex,
      };
    }
    return receive;
  }

  private setUtxoForCreateChileNodeTransactions(
    transactions: NodeTransactions,
    utxo: UtxoItem,
    params: createBrfcChildNodeParams,
    lastChangeAddress: string
  ) {
    return new Promise<NodeTransactions>(async (resolve, reject) => {
      try {
        const chain = HdWalletChain.MVC;
        if (params.nodeName === NodeName.SendMoney) {
          this.setTransferUtxoAndOutputAndSign(
            transactions.sendMoney!.transaction,
            [utxo],
            lastChangeAddress
          );
          transactions.sendMoney!.txId = transactions.sendMoney!.transaction.id;
          transactions.sendMoney!.utxo = utxo;
        } else if (this.isInfoNode(params.nodeName)) {
          this.setTransferUtxoAndOutputAndSign(
            transactions.currentNode!.transaction,
            [utxo],
            lastChangeAddress
          );
          // 更新txId
          transactions.currentNode!.txId =
            transactions.currentNode!.transaction.id;
          transactions.currentNode!.utxo = utxo;
        } else {
          if (transactions.metaFileBrfc?.transaction) {
            this.setTransferUtxoAndOutputAndSign(
              transactions.metaFileBrfc.transaction,
              [utxo],
              transactions.metaFileBrfc.address
            );
            // 更新txId
            transactions.metaFileBrfc.txId =
              transactions.metaFileBrfc.transaction.id;
            transactions.metaFileBrfc.utxo = utxo;
            // 更新本地bfrcNodeList
            this.updateBfrcNodeList(
              NodeName.MetaFile,
              transactions.metaFileBrfc
            );

            // 组装新 utxo
            utxo = await this.wallet!.utxoFromTx({
              tx: transactions.metaFileBrfc.transaction,
              chain,
            });

            // 当有 metafile Brfc 改变时 metafile 节点也需要重新构建，因为父节点Brfc的txid 已改变
            transactions.metaFiles!.length = 0;
            // 移除 旧的 metafile metaFileSha256TxIdList
            for (const item of params.attachments!) {
              const index = this.metaFileSha256TxIdList.findIndex(
                (_item) => _item.sha256 === item.sha256
              );
              if (index > -1) {
                this.metaFileSha256TxIdList.splice(index, 1);
              }
            }
            transactions.metaFiles = await this.createMetaFilesTransactions(
              transactions.metaFileBrfc!.txId,
              params.attachments,
              chain
            );
          }

          if (
            transactions.metaFiles &&
            transactions.metaFiles.filter((item) => item.transaction).length
          ) {
            const metaFileTransactions = transactions.metaFiles.filter(
              (item) => item.transaction
            );
            for (let i = 0; i < metaFileTransactions.length; i++) {
              const changeAddress =
                i < metaFileTransactions.length - 1
                  ? transactions.metaFileBrfc!.address
                  : transactions.currentNodeBrfc?.transaction
                  ? this.wallet!.protocolAddress
                  : transactions.currentNode?.transaction ||
                    transactions.nft?.genesis?.transaction ||
                    transactions.nft?.transfer?.transaction
                  ? transactions.currentNodeBrfc!.address
                  : lastChangeAddress;
              this.setTransferUtxoAndOutputAndSign(
                metaFileTransactions[i].transaction,
                [utxo],
                // 最后一个metafile 的找零地址 如果之后需要创建brfc节点 则打到 protocol 地址 否则 打到 bfr节点地址
                changeAddress
              );
              // 更新txId
              metaFileTransactions[i].txId =
                metaFileTransactions[i].transaction.id;
              metaFileTransactions[i].utxo = utxo;
              // 更新 所有的metafile Txid 待完善
              const metaFileSha256Index = this.metaFileSha256TxIdList.findIndex(
                (_item) => _item.sha256 === metaFileTransactions[i].sha256
              );
              if (metaFileSha256Index > -1) {
                this.metaFileSha256TxIdList[metaFileSha256Index].txId =
                  metaFileTransactions[i].txId;
              }

              // 组装新 utxo
              const addressInfo: any = {};
              if (i < metaFileTransactions.length - 1) {
                addressInfo.addressIndex =
                  transactions.metaFileBrfc!.addressIndex;
                addressInfo.addressType =
                  transactions.metaFileBrfc!.addressType;
              } else if (transactions.currentNodeBrfc?.transaction) {
                addressInfo.addressType = parseInt(
                  this.wallet!.keyPathMap["Protocols"].keyPath.split("/")[0]
                );
                addressInfo.addressIndex = parseInt(
                  this.wallet!.keyPathMap["Protocols"].keyPath.split("/")[1]
                );
              } else if (
                transactions.nft?.issue?.transaction ||
                transactions.currentNode?.transaction
              ) {
                addressInfo.addressIndex =
                  transactions.currentNodeBrfc!.addressIndex;
                addressInfo.addressType =
                  transactions.currentNodeBrfc!.addressType;
              }
              utxo = await this.wallet!.utxoFromTx({
                tx: metaFileTransactions[i].transaction,
                addressInfo,
                chain,
                // addressInfo: {
                //   addressIndex: transactions.metaFileBrfc!.addressIndex,
                //   addressType: transactions.metaFileBrfc!.addressType,
                // },
              });
            }

            // 再循环一边， 把每个metafile txId 更新到最新的， 防止没有更新 ： batchCreateBrfcChildNode 的时候
            for (let i = 0; i < transactions.metaFiles.length; i++) {
              if (!transactions.metaFiles[i].transaction) {
                const index = this.metaFileSha256TxIdList.findIndex(
                  (item) => item.sha256 === transactions.metaFiles![i].sha256
                );
                if (index > -1) {
                  transactions.metaFiles[i].txId =
                    this.metaFileSha256TxIdList[index].txId;
                }
              }
            }
          }

          if (params.nodeName !== NodeName.MetaFile) {
            if (transactions.currentNodeBrfc?.transaction) {
              this.setTransferUtxoAndOutputAndSign(
                transactions.currentNodeBrfc.transaction,
                [utxo],
                transactions.currentNodeBrfc.address
              );
              // 更新txId
              transactions.currentNodeBrfc.txId =
                transactions.currentNodeBrfc.transaction.id;
              transactions.currentNodeBrfc.utxo = utxo;
              // 更新本地bfrcNodeList
              this.updateBfrcNodeList(
                params.nodeName,
                transactions.currentNodeBrfc
              );

              // 组装新 utxo
              utxo = await this.wallet!.utxoFromTx({
                tx: transactions.currentNodeBrfc!.transaction,
                chain,
              });
            }

            // metafile txId变了，所以要改变currentNode 节点的data 对应数据
            if (transactions.metaFiles && transactions.metaFiles.length) {
              for (let i = 0; i < transactions.metaFiles.length; i++) {
                const fileSuffix =
                  params.attachments![i].fileName.split(".")[
                    params.attachments![i].fileName.split(".").length - 1
                  ];
                params.data = params.data!.replaceAll(
                  `$[${i}]`,
                  `${transactions.metaFiles[i].txId}.${fileSuffix}`
                );
              }
            }

            const createCurrentNodeParams = {
              ...params,
              brfcTxId: transactions.currentNodeBrfc!.txId!,
              ...AllNodeName[params.nodeName as NodeName]!,
            };

            if (
              params.nodeName === NodeName.NftGenesis ||
              params.nodeName === NodeName.NftTransfer ||
              params.nodeName === NodeName.NftSell ||
              params.nodeName === NodeName.NftCancel ||
              params.nodeName === NodeName.nftBuy
            ) {
              const scriptPlayload = await this.getScriptPlayload(
                createCurrentNodeParams,
                chain
              );
              const nftManager = this.wallet!.getNftManager();
              const _params = {
                ...JSON.parse(params.data!),
                opreturnData: scriptPlayload,
                noBroadcast: true,
                utxos: [utxo],
                changeAddress: lastChangeAddress,
                sellerWif: this.getPathPrivateKey("0/0")?.toString(),
                buyerWif: this.getPathPrivateKey("0/0")?.toString(),
              };
              const NFTOperateFunName = {
                ...this.transactionsNFTKey,
                [NodeName.NftCancel]: "cancelSell",
              };
              // @ts-ignore
              const res = await nftManager![NFTOperateFunName[params.nodeName]](
                _params
              );
              if (res && typeof res !== "number") {
                if (params.nodeName === NodeName.NftGenesis) {
                  transactions.nft!.genesis = {
                    txId: res.txid!,
                    transaction: res.tx!,
                    // @ts-ignore
                    codehash: res!.codehash!,
                    // @ts-ignore
                    genesis: res!.genesis!,
                    // @ts-ignore
                    sensibleId: res!.sensibleId!,
                  };
                } else if (params.nodeName === NodeName.NftSell) {
                  transactions.nft!.sell = {
                    sellTransaction: res.sellTx!,
                    sellTxId: res.sellTxId!,
                    txId: res.txid!,
                    transaction: res.tx!,
                  };
                } else if (
                  params.nodeName === NodeName.nftBuy ||
                  params.nodeName === NodeName.NftCancel
                ) {
                  // @ts-ignore
                  transactions.nft![this.transactionsNFTKey[params.nodeName]] =
                    {
                      txId: res.txid!,
                      transaction: res.tx!,
                      unlockCheckTxId: res.unlockCheckTxId!,
                      unlockCheckTransaction: res.unlockCheckTx!,
                    };
                } else {
                  // @ts-ignore
                  transactions.nft![this.transactionsNFTKey[params.nodeName]] =
                    {
                      txId: res.txid!,
                      transaction: res.tx!,
                    };
                }
              }
            } else {
              const res = await this.wallet?.createBrfcChildNode(
                // @ts-ignore
                createCurrentNodeParams,
                {
                  isBroadcast: false,
                  chain,
                }
              );
              if (res) transactions.currentNode = res;

              this.setTransferUtxoAndOutputAndSign(
                transactions.currentNode!.transaction,
                [utxo],
                params.nodeName === NodeName.NftIssue
                  ? this.wallet!.rootAddress
                  : lastChangeAddress
              );
              console.log("currentNode", utxo);
              // 更新txId
              transactions.currentNode!.txId =
                transactions.currentNode!.transaction.id;
              transactions.currentNode!.utxo = utxo;

              if (params.nodeName === NodeName.NftIssue) {
                // 组装新 utxo
                utxo = await this.wallet!.utxoFromTx({
                  tx: transactions.currentNode!.transaction,
                  chain,
                });
                console.log("NftIssue", utxo);
                const data = JSON.parse(params.data!);
                const nftManager = this.wallet!.getNftManager();
                const res = await nftManager!.mint({
                  sensibleId: data.sensibleId,
                  metaTxId: transactions.currentNode!.txId,
                  noBroadcast: true,
                  metaOutputIndex: 0,
                  utxos: [utxo],
                  changeAddress: lastChangeAddress,
                });
                if (res) {
                  transactions.nft!.issue = {
                    tokenIndex: res.tokenIndex!,
                    transaction: res.tx,
                    // @ts-ignore
                    txId: res!.txid!,
                  };
                }
              }
            }
          }
        }

        // 把nft mvc transaction -> Bsv transaction
        // if (params.payType === SdkPayType.BSV && transactions.nft) {
        //   for (let i in transactions.nft) {
        //     // @ts-ignore
        //     if (transactions.nft[i].transaction) {
        //       // @ts-ignore
        //       transactions.nft[i].transaction.version = WalletTxVersion.BSV;
        //       // @ts-ignore
        //       transactions.nft[i].id = transactions.nft[i].transaction.id;
        //     }
        //   }
        // }
        resolve(transactions);
      } catch (error) {
        reject(error);
      }
    });
  }

  private getScriptPlayload(
    params: HdWalletCreateBrfcChildNodeParams,
    chain = HdWalletChain.MVC
  ) {
    return new Promise<(string | Buffer)[]>(async (resolve, reject) => {
      const res = await this.wallet
        ?.createBrfcChildNode(params, {
          isBroadcast: false,
          chain,
        })
        .catch((error) => {
          reject(error);
        });
      if (res) {
        resolve(res.scriptPlayload!);
      }
    });
  }

  private getBrfcNode(
    params: CreateBrfcNodeParams,
    option?: { isBroadcast?: boolean; chain?: HdWalletChain }
  ) {
    return new Promise<CreateNodeBrfcRes>(async (resolve, reject) => {
      try {
        if (
          this.bfrcNodeList.some((item) => item.nodeName === params.nodeName)
        ) {
          resolve(
            this.bfrcNodeList.find((item) => item.nodeName === params.nodeName)!
              .data
          );
        } else {
          const currentNodeBrfc = await this.wallet?.createBrfcNode(
            params,
            option
          );
          this.bfrcNodeList.push({
            nodeName: params.nodeName,
            data: {
              ...currentNodeBrfc!,
              transaction: undefined,
            },
          });
          resolve(currentNodeBrfc!);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // 更新本地存储的brfc节点信息
  private updateBfrcNodeList(nodeName: NodeName, nodeInfo: CreateNodeBrfcRes) {
    const index = this.bfrcNodeList.findIndex(
      (item) => item.nodeName === nodeName
    );
    if (index !== -1) {
      this.bfrcNodeList[index].data = {
        ...nodeInfo,
        transaction: undefined,
      };
    }
  }

  private convertTransactionsIntoJob(
    transactions: NodeTransactions,
    payToRes: CreateNodeBaseRes | undefined,
    subscribeId: string
  ) {
    const job: Job = {
      id: subscribeId,
      name: "AReallyNormalJob",
      steps: [],
      status: JobStatus.Waiting,
    };
    const converting: Transaction[] = [];

    // A. 收集交易
    // 1. 打钱交易
    if (payToRes && payToRes.transaction) {
      converting.push(payToRes.transaction);
    }
    // 2. Metafile Brfc交易
    if (transactions.metaFileBrfc?.transaction) {
      converting.push(transactions.metaFileBrfc.transaction);
    }
    // 3. Metafile 交易
    if (
      transactions.metaFiles &&
      transactions.metaFiles.filter((item) => item.transaction).length
    ) {
      const metafileTransactionList = transactions.metaFiles.filter(
        (item) => item.transaction
      );
      for (let i = 0; i < metafileTransactionList.length; i++) {
        converting.push(metafileTransactionList[i].transaction);
      }
    }
    // 4. 当前节点 Brfc 交易
    if (transactions.currentNodeBrfc?.transaction) {
      converting.push(transactions.currentNodeBrfc.transaction);
    }
    // 5. 当前节点交易
    if (transactions.currentNode?.transaction) {
      converting.push(transactions.currentNode.transaction);
    }
    // 6. NFT issue 交易
    if (transactions.nft?.issue?.transaction) {
      converting.push(transactions.nft?.issue?.transaction);
    }

    // B. 将交易转换为step
    converting.forEach((tx: any) => {
      job.steps.push({
        txId: tx.id,
        txHex: tx.toString(),
        status: JobStepStatus.Waiting,
      });
    });
    // C. 将job推进队列
    this.globalJob.push(job);
  }

  isInfoNode(nodeName: NodeName) {
    const target = AllNodeName[nodeName];
    if (target) {
      if (target.path === "info") {
        return true;
      } else {
        false;
      }
    } else {
      // @ts-ignore
      throw new Error("Not Found Node Name" + ":" + nodeName);
    }
  }

  getAmountUxto(params: {
    sdkPayType: SdkPayType;
    amount: number;
    nodeName: NodeName;
    receive: {
      address: string;
      addressType: number;
      addressIndex: number;
    };
  }) {
    return new Promise<{
      utxo: UtxoItem;
      payToRes?: CreateNodeBaseRes;
    }>(async (resolve, reject) => {
      let utxo: UtxoItem;
      let payToRes: CreateNodeBaseRes | undefined = undefined;
      try {
        if (params.sdkPayType === SdkPayType.SPACE) {
          const chain = HdWalletChain.MVC;
          const allUtxos = await this.wallet?.provider.getUtxos(
            this.wallet.wallet.xpubkey.toString(),
            chain
          );
          const useUtxos = [];
          if (allUtxos && allUtxos?.length > 0) {
            // 总价加个 最小金额  给转账费用
            let leftAmount = params.amount + DUST_AMOUNT;
            for (let i = 0; i < allUtxos.length; i++) {
              if (leftAmount > 0) {
                useUtxos.push(allUtxos[i]);
                leftAmount -= allUtxos[i].satoshis;
              } else {
                break;
              }
            }
            if (leftAmount > 0) {
              // @ts-ignore
              throw new Error(`Insufficient balance`);
            } else {
              const res = await this.wallet?.makeTx({
                utxos: useUtxos,
                opReturn: [],
                change: this.wallet.rootAddress,
                payTo: [
                  {
                    amount: params.amount,
                    address: params.receive.address,
                  },
                ],
                chain,
              });
              if (res) {
                payToRes = {
                  transaction: res,
                  txId: res.id,
                };
                utxo = await this.wallet!.utxoFromTx({
                  tx: payToRes.transaction,
                  outPutIndex: 0,
                  chain,
                });
              }
            }
          }
        }
        resolve({
          utxo: utxo!,
          payToRes: payToRes,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  setTransferUtxoAndOutputAndSign(
    tx: mvc.Transaction,
    utxos: UtxoItem[],
    changeAddress: string,
    useFeeb = DEFAULTS.feeb
  ) {
    tx.from(utxos);
    // @ts-ignore
    // if (tx.isNeedChange()) {
    // }

    tx.change(changeAddress);
    // @ts-ignore
    tx.fee(Math.ceil(tx._estimateSize() * useFeeb));

    const privateKeys = this.wallet!.getUtxosPrivateKeys(utxos);
    // @ts-ignore
    tx.sign(privateKeys);
  }

  public broadcastNodeTransactions(
    transactions: NodeTransactions,
    option?: {
      notBroadcastKeys?: string[];
    }
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // 广播 SendMoney
        if (
          !option?.notBroadcastKeys?.includes("sendMoney") &&
          transactions.sendMoney?.transaction
        ) {
          await this.wallet?.provider.broadcast(
            transactions.sendMoney.transaction.toString()
          );
        }
        // 广播 Metafile Brfc
        if (
          !option?.notBroadcastKeys?.includes("metaFileBrfc") &&
          transactions.metaFileBrfc?.transaction
        ) {
          await this.wallet?.provider.broadcast(
            transactions.metaFileBrfc.transaction.toString()
          );
        }
        // 广播 Metafile
        if (
          !option?.notBroadcastKeys?.includes("metaFiles") &&
          transactions.metaFiles &&
          transactions.metaFiles.length
        ) {
          let catchError;
          for (
            let i = 0;
            i <
            transactions.metaFiles.filter((item) => item.transaction).length;
            i++
          ) {
            try {
              await this.wallet?.provider.broadcast(
                transactions.metaFiles[i].transaction.toString()
              );
            } catch (error) {
              catchError = (error as any).message;
              break;
            }
          }
          if (catchError) {
            throw new Error(catchError);
          }
        }
        // 广播当前节点的Brfc节点
        if (
          !option?.notBroadcastKeys?.includes("currentNodeBrfc") &&
          transactions.currentNodeBrfc?.transaction
        ) {
          await this.wallet?.provider.broadcast(
            transactions.currentNodeBrfc.transaction.toString()
          );
        }
        // 广播当前节点
        if (
          !option?.notBroadcastKeys?.includes("currentNode") &&
          transactions.currentNode?.transaction
        ) {
          await this.wallet?.provider.broadcast(
            transactions.currentNode.transaction.toString()
          );
        }

        // 广播 nft
        if (!option?.notBroadcastKeys?.includes("nft") && transactions.nft) {
          for (let i in transactions.nft) {
            if (i === "sell" && !option?.notBroadcastKeys?.includes("sell")) {
              // sell 先广播 sellTransaction
              await this.wallet?.provider.broadcast(
                transactions.nft[i]?.sellTransaction.toString()
              );
            } else if (
              i === "buy" ||
              (i === "cancel" && !option?.notBroadcastKeys?.includes(i))
            ) {
              //  buy / cancel 先广播 unlockCheckTransaction
              await this.wallet?.provider.broadcast(
                transactions.nft[i]!.unlockCheckTransaction.toString()
              );
            }

            if (!option?.notBroadcastKeys?.includes(i)) {
              // @ts-ignore
              await this.wallet?.provider.broadcast(
                transactions.nft[i].transaction.toString()
              );
            }
          }
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // 统一回调处理
  async callback(
    res: MetaIdJsRes,
    option?: {
      resolve?: (value: any) => any;
      reject?: (reason: any) => void;
    }
  ) {
    if (typeof res === "string") {
      try {
        res = JSON.parse(res);
      } catch (error) {
        if (option?.reject) option?.reject(error);
        else return error;
      }
    }
    if (res.code !== 200 && res.code !== 205 && res.code !== 201) {
      if (option?.reject) {
        if (res.data.message) {
          option?.reject(new Error(res.data.message));
        } else {
          option?.reject(undefined);
        }
      } else return res;
    } else {
      if (option?.resolve) option?.resolve(res.data);
      else return res.data;
    }
  }
}
