import {
  NodeName,
  Network,
  SdkPayType,
  HdWalletChain,
  MetaidTag,
  WalletPath,
  IsEncrypt,
} from "@/enum";
import AllNodeName from "@/utils/AllNodeName";
// @ts-ignore
import mvc from "mvc-lib";
//import { mvc } from "meta-contract";
import { isEmail, isNaturalNumber, hdWalletFromMnemonic } from "@/utils";
import { MetaIdProvider } from "metaid-provider";
import { BaseApiConstructorParams } from "metaid-provider/src/api/base";
import { MetaIdUserInfo } from "metaid-provider/src/types/metaid";
import HdWallet from "@/utils/wallet/hd-wallet";
//@ts-ignore
//import { NftManager, FtManager, API_TARGET } from "meta-contract";
export const DEFAULTS = {
  feeb: 1,
  minAmount: 546,
};
export const DUST_AMOUNT = 546;

export const isBrowserEnv = typeof window === "undefined" ? false : true;
console.log("isBrowserEnv", isBrowserEnv);
export class MetaIDSdk {
  mnemonic: string = `market pole juice jazz soda before slow never youth mutual figure climb`;
  bfrcNodeList: { nodeName: NodeName; data: CreateNodeBrfcRes }[] = []; // 存储Brfc节点， 防止未广播时重复构建
  metaFileSha256TxIdList: { sha256: string; txId: string }[] = []; // 存储metaFileSha256TxId， 防止未广播时重复构建
  network = Network.testnet;
  MetaIdTag: MetaidTag = MetaidTag.test;
  addressSessionKey = "AddressPath";
  addressPaths: AddressPathItem[] = isBrowserEnv
    ? window.sessionStorage.getItem(this.addressSessionKey)
      ? JSON.parse(window.sessionStorage.getItem(this.addressSessionKey)!)
      : []
    : [];
  // rootAddress: string=``;
  // xpubkey: string;
  wallet: HdWallet | null = null;
  metasvApi: string;
  metaidProvider: MetaIdProvider;
  metaidInfo: MetaIdInfoTypes | null = null;
  keyPathMap: KeyPathObjTypes = {
    Root: {
      keyPath: "0/0",
      parentKeyPath: "0/0",
    },
    Info: {
      keyPath: "0/1",
      parentKeyPath: "0/0",
    },
    Protocols: {
      keyPath: "0/2",
      parentKeyPath: "0/0",
    },

    name: {
      keyPath: "0/2",
      parentKeyPath: "0/1",
    },
    email: {
      keyPath: "0/3",
      parentKeyPath: "0/1",
    },
    phone: {
      keyPath: "0/4",
      parentKeyPath: "0/1",
    },
    avatar: {
      keyPath: "0/5",
      parentKeyPath: "0/1",
    },
    bio: {
      keyPath: "0/6",
      parentKeyPath: "0/1",
    },
  };
  public newBrfcNodeBaseInfoList: NewBrfcNodeBaseInfo[] = [];
  transactionsNFTKey = {
    [NodeName.NftGenesis]: "genesis",
    [NodeName.NftTransfer]: "transfer",
    [NodeName.NftSell]: "sell",
    [NodeName.NftCancel]: "cancel",
    [NodeName.nftBuy]: "buy",
  };
  // 当查询是有某个节点时， 查询完存到这里， 反之重复调接口查询
  private userBrfcNodeList: UserProtocolBrfcNode[] = [];
  constructor(params: {
    network: any;
    // rootAddress: string;
    // xpubkey: string;
    providerApi: BaseApiConstructorParams;
    // wallet: HdWallet;
  }) {
    // this.xpubkey = params.xpubkey;
    this.network = params.network;
    this.metasvApi = params.providerApi.base!.metaSvBaseUrl!;
    // this.rootAddress = params.rootAddress;
    this.MetaIdTag =
      this.network === Network.testnet ? MetaidTag.test : MetaidTag.main;
    this.metaidProvider = new MetaIdProvider(params.providerApi);
  }

  get rootAddress() {
    return this.wallet!.wallet.deriveChild(0)
      .deriveChild(0)
      .privateKey.toAddress(this.network)
      .toString();
  }
  get xpubkey() {
    return this.wallet!.wallet.xpubkey.toString();
  }

  get userProtocols() {
    return this.userBrfcNodeList;
  }

  get protocolAddress(): string {
    return this.createAddress(this.keyPathMap.Protocols.keyPath).address;
  }

  get infoAddress(): string {
    return this.createAddress(this.keyPathMap.Info.keyPath).address;
  }

  async initWallet() {
    const hdWallet = await hdWalletFromMnemonic(
      this.mnemonic,
      "new",
      this.network,
      WalletPath[this.network]
    );
    this.wallet = new HdWallet(hdWallet);
  }

  public async getMetaIdInfo(): Promise<MetaIdInfoTypes> {
    let metaIdInfo: MetaIdInfoTypes = {
      metaId: "",
      metaIdTag: "",
      infoTxId: "",
      protocolTxId: "",
      name: "",
      phone: "",
      email: "",
    };
    const metaId = await this.metaidProvider.address
      .getMetaId(this.rootAddress)
      .catch((error: any) => {
        throw new Error(error.message);
      });
    if (metaId) {
      const info = await this.metaidProvider.metaId.getUserInfo(metaId);
      metaIdInfo = {
        ...metaIdInfo,
        ...info,
      };
    }

    return metaIdInfo;
  }

  public async build_meta_data(params: BuildMetaDataPramas) {
    const buzz = await this.createBrfcChildNode({
      nodeName: params.metaData.nodeName,
      data: params.metaData.data,
    }).catch((error) => {
      console.log(error);
    });
    console.log("buzz", buzz);
    return buzz;
  }

  public createBrfcChildNode(
    params: createBrfcChildNodeParams,
    option?: {
      isBroadcast?: boolean;
      payType?: SdkPayType;
      checkOnly?: boolean; //false弹窗，true不弹窗
    }
  ) {
    return new Promise<NodeTransactions | null>(async (resolve, reject) => {
      const initOption = {
        isBroadcast: true,
        payType: SdkPayType.SPACE,
        checkOnly: true,
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
      option = {
        ...initOption,
        ...option,
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
          // const balance = await this.getBalance(option?.payType!);
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
              sdkPayType: option?.payType,
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
              (option!.payType = this.rootAddress)
            );
            // 广播
            console.log("transactions", transactions);
            debugger;
            if (option!.isBroadcast) {
              // 广播 打钱操作
              if (payToRes && payToRes.transaction) {
                await this.metaidProvider.tx.broadcast(
                  payToRes.transaction.toString()
                );
              }
              // 广播 transactions 所有交易
              await this.broadcastNodeTransactions(transactions);
            }

            resolve({
              payToAddress: payToRes,
              ...transactions,
            });
          } else {
            resolve(null);
          }
        } else {
          // 默认有 UTXO 不弹窗
          // 广播
          if (option?.isBroadcast) {
            // 广播 transactions 所有交易
            console.log("transactions", transactions);
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

  //
  public async hdWalletCreateBrfcChildNode(
    params: HdWalletCreateBrfcChildNodeParams,
    option?: {
      isBroadcast: boolean; // 是否广播
      chain?: HdWalletChain;
    }
  ): Promise<CreateNodeBrfcRes> {
    return new Promise<CreateNodeBrfcRes>(async (resolve, reject) => {
      const initParams = {
        autoRename: true,
        version: "0.0.9",
        data: "NULL",
        dataType: "application/json",
        encoding: "UTF-8",
        payCurrency: "Space",
        payTo: [],
        attachments: [],
        utxos: [],
        useFeeb: DEFAULTS.feeb,
      };
      const initOption = {
        isBroadcast: true,
        chain: HdWalletChain.MVC,
      };
      params = {
        ...initParams,
        ...params,
      };
      option = {
        ...initOption,
        ...option,
      };
      try {
        // 是否指定地址
        let address;
        let publickey;
        const addressType = -1; // 叶子节点都用 -1
        const addressIndex = -1; // 叶子节点都用 -1
        if (params.publickey) {
          publickey = params.publickey;
          address = mvc.PublicKey.fromHex(params.publickey)
            .toAddress(this.network)
            .toString();
        } else {
          // 随机生生产 私钥
          // @ts-ignore
          const privateKey = new mvc.PrivateKey(undefined, this.network);
          publickey = privateKey.toPublicKey().toString();
          address = privateKey.toAddress(this.network).toString();
        }
        const node: NewNodeBaseInfo = {
          address,
          publicKey: publickey,
          path: `${addressType}/${addressIndex}`,
        };

        if (params.ecdh) {
          // 付费Buzz 待完善
          // if (params.data !== 'NULL' && typeof params.data === 'string') {
          //   let r: any
          //   r = JSON.parse(params.data)
          //   r[params.ecdh.type] = this.ecdhEncryptData(
          //     r[params.ecdh.type],
          //     params.ecdh.publickey,
          //     keyPath.join('/')
          //   )
          //   params.data = JSON.stringify(r)
          // }
        }
        const res = await this.createNode({
          nodeName: params.autoRename
            ? [params.nodeName, publickey.toString().slice(0, 11)].join("-")
            : params.nodeName,
          metaIdTag: this.MetaIdTag,
          parentTxId: params.brfcTxId,
          encrypt: params.encrypt,
          data: params.data,
          payTo: params.payTos,
          dataType: params.dataType,
          version: params.version,
          encoding: params.encoding,
          utxos: params.utxos,
          node,
          chain: option.chain,
        });
        if (res) {
          if (option.isBroadcast) {
            console.log("res", res);
            debugger;
            const response = await this.metaidProvider.tx.broadcast(
              res.transaction!.toString()
            );
            if (response?.txid) {
              resolve(res);
            }
          } else {
            resolve(res);
          }
        }
      } catch (error) {
        reject(error);
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
          const tx = await this.makeTx({
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
          const res = await this.createNode({
            ...params,
            parentTxId: this.metaidInfo!.infoTxId,
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
                parentTxId: this.metaidInfo!.protocolTxId,
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
              const res = await this.metaidProvider.tx.getTx(params.txId);
              if (res) {
                const protocol = await this.getProtocolInfo(
                  params.nodeName,
                  res.parentTxId,
                  res.parentData,
                  chain
                );
                transactions.currentNodeBrfc = {
                  address: res.parentAddress,
                  txId: res.parentTxId,
                  addressType: protocol!.addressType,
                  addressIndex: protocol!.addressIndex,
                };
              }
            } else {
              // 新增
              transactions.currentNodeBrfc = await this.getBrfcNode(
                {
                  nodeName: params.nodeName,
                  parentTxId: this.metaidInfo!.protocolTxId,
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
              const nftManager = this.getNftManager();
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
              transactions.currentNode = await this.hdWalletCreateBrfcChildNode(
                createCurrentNodeParams,
                {
                  isBroadcast: false,
                  chain,
                }
              );

              // nft issue
              if (params.nodeName === NodeName.NftIssue) {
                const data = JSON.parse(params.data!);
                const nftManager = this.getNftManager();
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

  public getNftManager = (): NftManager => {
    const nftManager = new NftManager({
      apiTarget: API_TARGET.MVC,
      // @ts-ignore
      network: this.network,
      purse: this.wallet!.wallet.deriveChild(0)
        .deriveChild(0)
        .privateKey.toString(),
      feeb: DEFAULTS.feeb,
      apiHost: this.metasvApi,
    });
    return nftManager;
  };

  public async makeTx({
    payTo = [],
    outputs = [],
    change = this.rootAddress,
    opReturn,
    utxos,
    useFeeb = DEFAULTS.feeb,
    chain = HdWalletChain.MVC,
  }: TransferTypes): Promise<mvc.Transaction> {
    return new Promise(async (resolve, reject) => {
      try {
        const { tx } = await this.makeTxNotUtxos({
          payTo,
          outputs,
          opReturn,
          useFeeb,
          utxos,
          chain,
        });

        tx.change(change);
        // @ts-ignore
        tx.getNeedFee = function () {
          // @ts-ignore
          const amount = Math.ceil(
            // @ts-ignore
            (30 + this._estimateSize() + 182) * useFeeb
          );
          // @ts-ignore
          const offerFed = Math.ceil(amount * useFeeb);
          // if (amount < minAmount) amount = minAmount
          const total =
            offerFed + amount < mvc.Transaction.DUST_AMOUNT
              ? mvc.Transaction.DUST_AMOUNT + 30
              : offerFed + amount;

          return total;
        };
        // @ts-ignore
        tx.isNeedChange = function () {
          return (
            // @ts-ignore
            ((this._getUnspentValue() - this.getNeedFee()) as number) >=
            mvc.Transaction.DUST_AMOUNT
          );
        };
        // @ts-ignore
        tx.getChangeAmount = function () {
          // @ts-ignore
          return (this._getUnspentValue() - this.getNeedFee()) as number;
        };

        if (utxos) {
          tx.from(utxos);
        }
        tx.fee(Math.ceil(tx._estimateSize() * useFeeb));
        const privateKeys = this.getUtxosPrivateKeys(utxos);
        // @ts-ignore
        tx.sign(privateKeys);
        resolve(tx);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async makeTxNotUtxos({
    payTo = [],
    outputs = [],
    utxos = [],
    opReturn,
    useFeeb = DEFAULTS.feeb,
    chain = HdWalletChain.MVC,
  }: TransferTypes) {
    const tx = new mvc.Transaction();

    // 添加 payto
    if (Array.isArray(payTo) && payTo.length) {
      payTo.forEach((item) => {
        if (!this.isValidOutput(item)) {
          throw new Error("Output format error.");
        }
        tx.to(item.address, item.amount);
      });
    }

    // 添加 opReturn 内容
    if (opReturn) {
      tx.addOutput(
        new mvc.Transaction.Output({
          script: mvc.Script.buildSafeDataOut(opReturn),
          satoshis: 0,
        })
      );
    }

    if (Array.isArray(outputs) && outputs.length) {
      outputs.forEach((output) => {
        tx.addOutput(new mvc.Transaction.Output(output));
      });
    }

    if (utxos.length > 0) {
      tx.from(utxos);
    }
    return {
      tx,
    };
  }

  // 验证交易输出 TODO：地址只验证长度，后续要做合法性验证
  private isValidOutput(output: OutputTypes): boolean {
    return (
      isNaturalNumber(output.amount) && +output.amount >= DEFAULTS.minAmount
    );
  }

  public createAddress(keyPath: string): {
    address: string;
    publicKey: string;
  } {
    const privateKey = this.getPathPrivateKey(keyPath);
    const address = privateKey.toAddress(this.network).toString();

    return {
      address: address,
      publicKey: privateKey.toPublicKey(),
    };
  }

  // 根据 path 生成 privateKey
  public getPathPrivateKey(keyPath: string) {
    const privateKey = this.wallet?.wallet
      .deriveChild(+keyPath.split("/")[0])
      .deriveChild(+keyPath.split("/")[1]).privateKey;

    return privateKey;
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

  public async createNode({
    nodeName,
    payTo = [],
    utxos = [],
    change,
    metaIdTag = MetaidTag.test,
    parentTxId = "NULL",
    data = "NULL",
    encrypt = IsEncrypt.No,
    version = "1.0.1",
    dataType = "text/plain",
    encoding = "UTF-8",
    outputs = [],
    node,
    chain = HdWalletChain.MVC,
  }: CreateNodeOptions) {
    return new Promise<CreateNodeBaseRes>(async (resolve, reject) => {
      try {
        if (!nodeName) {
          throw new Error("Parameter Error: NodeName can not empty");
        }
        let privateKey = this.getPathPrivateKey("0/0");
        // TODO: 自定义节点支持
        if (this.keyPathMap[nodeName]) {
          const nodeInfo = this.keyPathMap[nodeName];
          node = {
            path: nodeInfo.keyPath,
            publicKey: this.createAddress(nodeInfo.keyPath).publicKey,
            address: this.createAddress(nodeInfo.keyPath).address,
          };
        } else {
          if (encoding === encoding) {
            // 文件
            if (!node) {
              // @ts-ignore
              const _privateKey = new mvc.PrivateKey(undefined, this.network);
              const _publickey = _privateKey.toPublicKey().toString();
              const _address = _privateKey.toAddress(this.network).toString();
              node = {
                address: _address,
                publicKey: _publickey,
                path: `-1/-1`,
              };
            }
          } else {
            if (!node) {
              throw new Error("Parameter Error: node can not empty");
            }
          }
        }
        // 数据加密
        if (+encrypt === 1) {
          data = this.wallet!.eciesEncryptData(
            data,
            privateKey,
            privateKey.publicKey
          ).toString("hex");
        } else {
          if (encoding.toLowerCase() === "binary") {
            data = Buffer.from(data.toString("hex"), "hex");
          }
        }

        const chain = await this.metaidProvider.tx.getChain(parentTxId);

        const scriptPlayload = [
          "mvc",
          node.publicKey.toString(),
          `${chain}:${parentTxId}`,
          metaIdTag.toLowerCase(),
          nodeName,
          data,
          encrypt.toString(),
          version,
          dataType,
          encoding,
        ];
        const makeTxOptions = {
          from: [],
          utxos: utxos,
          opReturn: scriptPlayload,
          change: change,
          outputs,
          payTo,
          chain,
        };

        // TODO: 父节点 utxo 管理

        const nodeTx = await this.makeTx(makeTxOptions);

        if (nodeTx) {
          resolve({
            hex: nodeTx.toString(),
            transaction: nodeTx,
            txId: nodeTx.id,
            address: node.address,
            addressType: parseInt(node.path.split("/")[0]),
            addressIndex: parseInt(node.path.split("/")[1]),
            scriptPlayload: scriptPlayload,
          });
        }
      } catch (error) {
        reject(error);
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
          const currentNodeBrfc = await this.createBrfcNode(params, option);
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

  // 创建协议节点
  public createBrfcNode(
    params: CreateBrfcNodePrams,
    option?: {
      isBroadcast?: boolean;
      chain?: HdWalletChain;
    }
  ) {
    return new Promise<CreateNodeBrfcRes>(async (resolve, reject) => {
      try {
        const initParams = {
          useFeeb: DEFAULTS.feeb,
          payTo: [],
          utxos: [],
        };
        const initOption = {
          isBroadcast: true,
          chain: HdWalletChain.MVC,
        };
        params = {
          ...initParams,
          ...params,
        };
        option = {
          ...initOption,
          ...option,
        };
        if (!params.useFeeb) params.useFeeb = DEFAULTS.feeb;
        if (!params.payTo) params.payTo = [];

        const nodeName = AllNodeName[params.nodeName as NodeName];

        let protocol = await this.getProtocolInfo(
          params.nodeName,
          params.parentTxId,
          nodeName.brfcId,
          option!.chain!
        );

        //  处理根节点
        if (protocol) {
          resolve({
            address: protocol.address,
            txId: protocol.txId,
            addressType: protocol.addressType,
            addressIndex: protocol.addressIndex,
          });
          // 已存在根节点
        } else {
          // 不存在根节点

          const newBrfcNodeBaseInfo = await this.getNewBrfcNodeBaseInfo(
            this.xpubkey.toString(),
            params.parentTxId
          );

          const protocolRoot = await this.createNode({
            ...params,
            metaIdTag: this.MetaIdTag,
            data: nodeName.brfcId,
            utxos: params.utxos,
            node: newBrfcNodeBaseInfo,
            chain: option!.chain!,
          });
          if (protocolRoot) {
            if (option.isBroadcast) {
              await this.metaidProvider.tx.broadcast(
                protocolRoot.transaction.toString(),
                option!.chain
              );
            }

            resolve({
              address: protocolRoot.address,
              txId: protocolRoot.txId,
              addressType: parseInt(newBrfcNodeBaseInfo.path!.split("/")[0]),
              addressIndex: parseInt(newBrfcNodeBaseInfo.path!.split("/")[1]),
              transaction: protocolRoot.transaction,
            });
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async getProtocolInfo(
    nodeName: NodeName,
    protocolsTxId: string,
    brfcId: string,
    chain = HdWalletChain.MVC
  ) {
    return new Promise<ProtocolBrfcNode | null>(async (resolve, reject) => {
      try {
        let brfcNode = this.userBrfcNodeList.find(
          (item) => item.nodeName == nodeName && item.brfcId === brfcId
        );
        if (brfcNode) {
          resolve(brfcNode);
        } else {
          const protocols: any = await this.metaidProvider.address.getProtocols(
            {
              protocolsTxId: protocolsTxId,
              protocolType: nodeName,
            }
          );

          const protocol = protocols.filter((item: any) => {
            return item?.nodeName === nodeName && item?.data === brfcId;
          })[0];
          if (protocol) {
            const res = await this.getAddressPath(protocol.address);
            const protocolInfo = {
              xpub: this.xpubkey.toString(),
              address: protocol.address,
              addressType: 0,
              addressIndex: res.path,
            };
            if (protocolInfo) {
              this.userBrfcNodeList.push({
                ...protocol,
                ...protocolInfo,
                nodeName,
                brfcId,
              });
              resolve({
                ...protocol,
                ...protocolInfo,
              });
            }
          } else {
            resolve(null);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  getAddressPath(address: string) {
    let item = this.addressPaths.find((item) => item.address === address);
    if (item) {
      return item;
    } else {
      for (let i = 0; i <= 10000; i++) {
        const _address = this.wallet!.wallet.deriveChild(`m/0/${i}`)
          .privateKey.toAddress(this.network)
          .toString();
        if (_address === address) {
          console.log("path", i);
          item = {
            address: address,
            path: i,
          };
          this.addressPaths.push(item);
          window.sessionStorage.setItem(
            this.addressSessionKey,
            JSON.stringify(this.addressPaths)
          );
          break;
        }
      }
      if (item) {
        return item;
      } else {
        // @ts-ignore
        throw new Error(`PathMoreThan10000`);
      }
    }
  }

  private getScriptPlayload(
    params: HdWalletCreateBrfcChildNodeParams,
    chain = HdWalletChain.MVC
  ) {
    return new Promise<(string | Buffer)[]>(async (resolve, reject) => {
      const res = await this.createBrfcChildNode(params, {
        isBroadcast: false,
      }).catch((error) => {
        reject(error);
      });
      if (res) {
        resolve(res.scriptPlayload!);
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
          const res = await this.metaidProvider.xpub.getBalance(
            this.xpubkey.toString()
          );
          if (res) balance = res.total;
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
        address: this.infoAddress,
        addressType: parseInt(this.keyPathMap["Info"].keyPath.split("/")[0]),
        addressIndex: parseInt(this.keyPathMap["Info"].keyPath.split("/")[1]),
      };
    }
    if (transactions.sendMoney?.transaction) {
      receive = {
        address: this.rootAddress,
        addressType: parseInt(
          this.keyPathMap["Protocols"].keyPath.split("/")[0]
        ),
        addressIndex: parseInt(
          this.keyPathMap["Protocols"].keyPath.split("/")[0]
        ),
      };
    } else if (transactions.metaFileBrfc?.transaction) {
      // 需要创建 metafile brfc 节点 ，把钱打去 protocol 地址
      receive = {
        address: this.protocolAddress,
        addressType: parseInt(
          this.keyPathMap["Protocols"].keyPath.split("/")[0]
        ),
        addressIndex: parseInt(
          this.keyPathMap["Protocols"].keyPath.split("/")[1]
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
        address: this.protocolAddress,
        addressType: parseInt(
          this.keyPathMap["Protocols"].keyPath.split("/")[0]
        ),
        addressIndex: parseInt(
          this.keyPathMap["Protocols"].keyPath.split("/")[1]
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
          const allUtxos = await this.metaidProvider.xpub.getUtxo(
            this.xpubkey.toString()
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
              const res = await this.makeTx({
                utxos: useUtxos,
                opReturn: [],
                change: this.rootAddress,
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
                utxo = await this.utxoFromTx({
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

  utxoFromTx(params: {
    tx: mvc.Transaction;
    addressInfo?: {
      addressType: number;
      addressIndex: number;
    };
    outPutIndex?: number;
    chain?: HdWalletChain;
  }) {
    return new Promise<UtxoItem>(async (resolve, reject) => {
      try {
        // 默认  outPutIndex = changeIndex
        if (typeof params?.outPutIndex === "undefined") {
          if (params.tx._changeIndex) {
            params.outPutIndex = params.tx._changeIndex;
          } else {
            params.outPutIndex = params.tx.outputs.length - 1;
          }
        }
        const OutPut = params.tx.outputs[params.outPutIndex];
        if (!params.chain) params.chain = HdWalletChain.MVC;
        if (!params.addressInfo) {
          const res = this.getAddressPath(
            OutPut.script.toAddress(this.network).toString()
          );
          params.addressInfo = {
            addressType: 0,
            addressIndex: res.path,
          };
        }
        // 把Utxo 标记为已使用， 防止被其他地方用了
        // this.provider.isUsedUtxos.push({
        //   txId: params.tx.id,
        //   address: OutPut.script.toAddress(this.network).toString(),
        // });
        resolve({
          address: OutPut.script.toAddress(this.network).toString(),
          satoshis: OutPut.satoshis,
          value: OutPut.satoshis,
          amount: OutPut.satoshis * 1e-8,
          script: OutPut.script.toHex(),
          outputIndex: params.outPutIndex!,
          txIndex: params.outPutIndex!,
          txId: params.tx.id,
          addressType: params!.addressInfo?.addressType!,
          addressIndex: params!.addressInfo?.addressIndex!,
          xpub: this.xpubkey.toString(),
          //metalet没有wif
          wif: this.getPathPrivateKey(
            `${params!.addressInfo?.addressType!}/${params!.addressInfo
              ?.addressIndex!}`
          )!.toString(),
        });
      } catch (error) {
        reject(error);
      }
    });
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
            utxo = await this.utxoFromTx({
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
                  ? this.protocolAddress
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
                  this.keyPathMap["Protocols"].keyPath.split("/")[0]
                );
                addressInfo.addressIndex = parseInt(
                  this.keyPathMap["Protocols"].keyPath.split("/")[1]
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
              utxo = await this.utxoFromTx({
                tx: metaFileTransactions[i].transaction,
                addressInfo,
                chain,
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
              utxo = await this.utxoFromTx({
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
              const nftManager = this.getNftManager();
              const _params = {
                ...JSON.parse(params.data!),
                opreturnData: scriptPlayload,
                noBroadcast: true,
                utxos: [utxo],
                changeAddress: lastChangeAddress,
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
              const res = await this.hdWalletCreateBrfcChildNode(
                // @ts-ignore
                createCurrentNodeParams,
                {
                  isBroadcast: false,
                }
              );
              if (res) transactions.currentNode = res;

              this.setTransferUtxoAndOutputAndSign(
                transactions.currentNode!.transaction,
                [utxo],
                params.nodeName === NodeName.NftIssue
                  ? this.rootAddress
                  : lastChangeAddress
              );
              console.log("currentNode", utxo);
              // 更新txId
              transactions.currentNode!.txId =
                transactions.currentNode!.transaction.id;
              transactions.currentNode!.utxo = utxo;

              if (params.nodeName === NodeName.NftIssue) {
                // 组装新 utxo
                utxo = await this.utxoFromTx({
                  tx: transactions.currentNode!.transaction,
                  chain,
                });
                console.log("NftIssue", utxo);
                const data = JSON.parse(params.data!);
                const nftManager = this.getNftManager();
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
    const privateKeys = this.getUtxosPrivateKeys(utxos);
    // @ts-ignore
    tx.sign(privateKeys);
  }

  public getAttachmentsMark(attachments: (AttachmentItem | string)[]) {
    let result = [];
    for (let i = 0; i < attachments.length; i++) {
      if (typeof attachments[i] === "string") {
        result.push(attachments[i]);
      } else {
        result.push(`metafile://$[${i}]`);
      }
    }
    return result;
  }

  public getUtxosPrivateKeys(utxos: UtxoItem[]): mvc.PrivateKey[] {
    return utxos.map((u) => {
      return this.wallet!.wallet.deriveChild(u.addressType || 0).deriveChild(
        u.addressIndex || 0
      ).privateKey;
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
            const response =
              await this.metaidProvider.metaId.GetMetafileBySha256({
                sha256: item.sha256,
              });
            if (response.length) {
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
              const res = await this.createNode({
                nodeName: item.fileName,
                metaIdTag: this.MetaIdTag,
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
          await this.metaidProvider.tx.broadcast(
            transactions.sendMoney.transaction.toString()
          );
        }
        // 广播 Metafile Brfc
        if (
          !option?.notBroadcastKeys?.includes("metaFileBrfc") &&
          transactions.metaFileBrfc?.transaction
        ) {
          await this.metaidProvider.tx.broadcast(
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
              await this.metaidProvider.tx.broadcast(
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
          await this.metaidProvider.tx.broadcast(
            transactions.currentNodeBrfc.transaction.toString()
          );
        }
        // 广播当前节点
        if (
          !option?.notBroadcastKeys?.includes("currentNode") &&
          transactions.currentNode?.transaction
        ) {
          await this.metaidProvider.tx.broadcast(
            transactions.currentNode.transaction.toString()
          );
        }

        // 广播 nft
        if (!option?.notBroadcastKeys?.includes("nft") && transactions.nft) {
          for (let i in transactions.nft) {
            if (i === "sell" && !option?.notBroadcastKeys?.includes("sell")) {
              // sell 先广播 sellTransaction
              await this.metaidProvider.tx.broadcast(
                transactions.nft[i]?.sellTransaction.toString()
              );
            } else if (
              i === "buy" ||
              (i === "cancel" && !option?.notBroadcastKeys?.includes(i))
            ) {
              //  buy / cancel 先广播 unlockCheckTransaction
              await this.metaidProvider.tx.broadcast(
                transactions.nft[i]!.unlockCheckTransaction.toString()
              );
            }

            if (!option?.notBroadcastKeys?.includes(i)) {
              // @ts-ignore
              await this.metaidProvider.tx.broadcast(
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

  public getNewBrfcNodeBaseInfo(xpub: string, parentTxId: string) {
    return new Promise<NewNodeBaseInfo>(async (resolve, reject) => {
      let node = this.newBrfcNodeBaseInfoList.find(
        (item) => !item.isUsed && item.parentTxId === parentTxId
      );

      if (!node) {
        const res = await this.metaidProvider.metaId.getNewBrfcNodeBaseInfo(
          xpub,
          parentTxId
        );
        if (res?.length) {
          for (let item of res) {
            this.newBrfcNodeBaseInfoList.push({
              ...item,
              parentTxId,
            });
          }
          node = this.newBrfcNodeBaseInfoList.find(
            (item) => !item.isUsed && item.parentTxId === parentTxId
          );
        } else {
          reject();
        }
      }
      node!.isUsed = true;
      resolve(node!);
    });
  }

  // 初始化 metaId
  public initMetaIdNode() {
    return new Promise<MetaIdInfoTypes>(async (resolve, reject) => {
      try {
        const metaIdInfo: any = await this.getMetaIdInfo();
        this.metaidInfo = metaIdInfo;
        console.log("this.metaidInfo", this.metaidInfo);
        // metaIdInfo.pubKey = this._root.toPublicKey().toString();
        //  检查 metaidinfo 是否完整
        if (
          metaIdInfo.metaId &&
          metaIdInfo.infoTxId &&
          metaIdInfo.protocolTxId
        ) {
          console.log("metaidinfo 完整");
          resolve(metaIdInfo);
        } else {
          let utxos: UtxoItem[] = [];
          const hexTxs = [];
          utxos = await this.metaidProvider.xpub.getUtxo(
            this.xpubkey.toString()
          );
          // 初始化 metaId
          if (!metaIdInfo.metaId) {
            // TODO: 尝试获始资金
            if (!utxos.length) {
              reject(`Utxo is empty`);
              // const initUtxo = await this.provider.getInitAmount({
              //   address: this.rootAddress,
              //   xpub: this.wallet.xpubkey.toString(),
              //   token: account.token || account.accessKey || "",
              //   userName:
              //     account.userType === "phone" ? account.phone : account.email,
              // });
              // utxos = [initUtxo];
            }

            let outputs: any[] = [];
            // if (account.referrerId) {
            //   outputs = [
            //     {
            //       script: mvc.Script.buildSafeDataOut([
            //         "ref:" + account.referrerId,
            //       ]),
            //       satoshis: 0,
            //     },
            //   ];
            // }
            const root = await this.createNode({
              nodeName: "Root",
              metaIdTag: this.MetaIdTag,
              data: "NULL",
              dataType: "NULL",
              encoding: "NULL",
              utxos: utxos,
              outputs: outputs,
            });
            hexTxs.push(root.transaction.toString());
            metaIdInfo.metaId = root.txId;
            const newUtxo = await this.utxoFromTx({
              tx: root.transaction,
              addressInfo: {
                addressType: 0,
                addressIndex: 0,
              },
            });
            if (newUtxo) {
              utxos = [newUtxo];
            }
          }

          // 初始化 metaId
          if (!metaIdInfo.protocolTxId) {
            const protocol = await this.createNode({
              nodeName: "Protocols",
              parentTxId: metaIdInfo.metaId,
              metaIdTag: this.MetaIdTag,
              data: "NULL",
              version: "NULL",
              utxos: utxos,
            });
            hexTxs.push(protocol.transaction.toString());
            metaIdInfo.protocolTxId = protocol.txId;
            const newUtxo = await this.utxoFromTx({
              tx: protocol.transaction,
              addressInfo: {
                addressType: 0,
                addressIndex: 0,
              },
            });
            if (newUtxo) utxos = [newUtxo];
          }

          // 初始化 infoTxId
          if (!metaIdInfo.infoTxId) {
            const info = await this.createNode({
              nodeName: "Info",
              parentTxId: metaIdInfo.metaId,
              metaIdTag: this.MetaIdTag,
              data: "NULL",
              version: "NULL",
              utxos: utxos,
              change: this.infoAddress,
            });
            hexTxs.push(info.transaction.toString());
            metaIdInfo.infoTxId = info.txId;
            const newUtxo = await this.utxoFromTx({
              tx: info.transaction,
              addressInfo: {
                addressType: 0,
                addressIndex: 1,
              },
            });
            if (newUtxo) utxos = [newUtxo];
          }

          // 初始化 name
          if (!metaIdInfo.name) {
            const name = await this.createNode({
              nodeName: "name",
              parentTxId: metaIdInfo.infoTxId,
              metaIdTag: this.MetaIdTag,
              data: `TestAccount${+new Date()}`,
              utxos: utxos,
              change: this.infoAddress,
            });
            hexTxs.push(name.transaction.toString());
            metaIdInfo.name = `TestAccount${+new Date()}`;
            const newUtxo = await this.utxoFromTx({
              tx: name.transaction,
              addressInfo: {
                addressType: 0,
                addressIndex: 1,
              },
            });
            if (newUtxo) utxos = [newUtxo];
          }

          // 初始化 loginName
          // if (!metaIdInfo[account.userType]) {
          //   const loginName =
          //     account.userType === "phone" ? account.phone : account.email;
          //   const loginNameTx = await this.createNode({
          //     nodeName: account.userType,
          //     parentTxId: metaIdInfo.infoTxId,
          //     metaIdTag: this.MetaIdTag,
          //     data: loginName,
          //     encrypt: 1,
          //     utxos: utxos,
          //     change: this.infoAddress,
          //   });
          //   hexTxs.push(loginNameTx.transaction.toString());
          //   metaIdInfo[account.userType] = loginName;
          //   const newUtxo = await this.utxoFromTx({
          //     tx: loginNameTx.transaction,
          //     addressInfo: {
          //       addressType: 0,
          //       addressIndex: 1,
          //     },
          //   });
          //   if (newUtxo) utxos = [newUtxo];
          // }

          // eth 绑定新 metaId 账号

          // if (account.ethAddress) {
          //   // 先把钱打回到 infoAddress
          //   const transfer = await this.makeTx({
          //     utxos: utxos,
          //     opReturn: [],
          //     change: this.rootAddress,
          //     payTo: [
          //       {
          //         amount: 1000,
          //         address: this.infoAddress,
          //       },
          //     ],
          //   });

          //   if (transfer) {
          //     hexTxs.push(transfer.toString());
          //     const newUtxo = await this.utxoFromTx({
          //       tx: transfer,
          //       addressInfo: {
          //         addressType: 0,
          //         addressIndex: 1,
          //       },
          //       outPutIndex: 0,
          //     });
          //     if (newUtxo) utxos = [newUtxo];

          //     // 创建 eth brfc节点 brfcId = ehtAddress
          //     const privateKey = this.getPathPrivateKey("0/6");
          //     const node: NewNodeBaseInfo = {
          //       address: privateKey.toAddress().toString(),
          //       publicKey: privateKey.toPublicKey().toString(),
          //       path: "0/6",
          //     };
          //     const ethBindBrfc = await this.createNode({
          //       nodeName: NodeName.ETHBinding,
          //       parentTxId: metaIdInfo.infoTxId,
          //       metaIdTag: this.MetaIdTag,
          //       data: JSON.stringify({ evmAddress: account.ethAddress! }),
          //       utxos: utxos,
          //       change: this.rootAddress,
          //       node,
          //     });
          //     if (ethBindBrfc) {
          //       hexTxs.push(ethBindBrfc.transaction.toString());
          //     }
          //   }
          // }

          let errorMsg: any;
          // 广播
          for (let i = 0; i < hexTxs.length; i++) {
            try {
              const tx = hexTxs[i];
              await this.metaidProvider.tx.broadcast(tx);
            } catch (error) {
              errorMsg = error;
            }
            if (errorMsg) {
              break;
            }
          }
          if (errorMsg) {
            throw new Error(errorMsg.message);
          } else {
            resolve(metaIdInfo);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}
