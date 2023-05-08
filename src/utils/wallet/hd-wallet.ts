//@ts-ignore
import mvc from "mvc-lib";
//import { mvc, Message } from "meta-contract";
// @ts-ignore
import { Message } from "mvc-lib";
// // @ts-ignore
// import { Utf8 } from "crypto-es/lib/core.js";
// // @ts-ignore
// import { AES } from "crypto-es/lib/aes.js";
// // @ts-ignore
// import { CBC, Pkcs7 } from "crypto-es/lib/cipher-core.js";
// // @ts-ignore
// import { MD5 } from "crypto-es/lib/md5.js";
// // @ts-ignore
// import { SHA256 } from "crypto-es/lib/sha256.js";
// @ts-ignore
// import Ripemd128 from "ripemd128-js/ripemd128.js";
// import * as bip39 from "bip39";
// @ts-ignore
import * as ECIES from "mvc-lib/ecies";
// import englishWords from "./englishWord";
import ShowmoneyProvider from "./showmoney-provider";

import { isEmail, isNaturalNumber } from "@/utils";
import AllNodeName from "@/utils/AllNodeName";
// @ts-ignore
// import { NftManager, FtManager, API_TARGET } from "meta-contract";
import { Session } from "@/utils/wallet/session";
import {
  HdWalletChain,
  Network,
  MetaNameOp,
  NodeName,
  IsEncrypt,
} from "@/enum";
import { hdWalletFromAccount } from "@/utils/index";
import Env from "@/config/config";
export const DEFAULTS = {
  feeb: 1,
  minAmount: 546,
};

const metasvServiceSecret =
  "KxSQqTxhonc5i8sVGGhP1cMBGh5cetVDMfZjQdFursveABTGVbZD";

export default class HdWallet {
  public network = Network.mainnet;
  public mnemonic: string = "";
  public wallet: mvc.HDPrivateKey;
  public provider: ShowmoneyProvider;
  private _utxos: MetasvUtxoTypes[] = [];
  public _root: mvc.PrivateKey;
  private protocols = [];
  public session: Session;
  public keyPathMap: KeyPathObjTypes = {
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

  // 已使用的publickey 地址，避免重复使用
  private publishkeyList: {
    address: string;
    index: number;
    path: string;
    publicKey: string;
    isUsed: boolean;
  }[] = [];

  // 当查询是有某个节点时， 查询完存到这里， 反之重复调接口查询
  private userBrfcNodeList: UserProtocolBrfcNode[] = [];

  constructor(
    wallet: mvc.HDPrivateKey,
    params?: {
      baseApi?: string;
      mvcMetaSvApi?: string;
      bsvMetaSvApi?: string;
    }
  ) {
    // @ts-ignore
    this.network = wallet.network.alias
      ? wallet.network.alias
      : wallet.network.name;
    this.wallet = wallet;
    const root = wallet.deriveChild(0).deriveChild(0).privateKey;
    this._root = root;
    this.session = new Session(this.wallet);
    console.log("this.wallet", this.wallet);
    if (!params) {
      params = {};
    }
    this.provider = new ShowmoneyProvider({
      ...params,
      network: this.network,
      session: this.session,
    });
  }

  get rootAddress(): string {
    return this._root.toAddress(this.network).toString();
  }

  get protocolAddress(): string {
    return this.createAddress(this.keyPathMap.Protocols.keyPath).address;
  }

  get infoAddress(): string {
    return this.createAddress(this.keyPathMap.Info.keyPath).address;
  }

  static async createFromAccount(
    account: BaseUserInfoTypes,
    network: Network = Network.mainnet
  ): Promise<HdWallet> {
    try {
      const walletObj = await hdWalletFromAccount(account, network);
      const hdWallet = new HdWallet(walletObj.mnemonic, walletObj.wallet);
      return hdWallet;
    } catch (error) {
      throw new Error("生成钱包失败-" + (error as any).message);
    }
  }

  public async getMetaIdInfo(rootAddress: string): Promise<MetaIdInfoTypes> {
    let metaIdInfo: MetaIdInfoTypes = {
      metaId: "",
      metaIdTag: "",
      infoTxId: "",
      protocolTxId: "",
      name: "",
      phone: "",
      email: "",
    };
    const metaId = await this.provider
      .getMetaId(rootAddress)
      .catch((error: any) => {
        throw new Error(error.message);
      });
    if (metaId) {
      const info = await this.provider.getMetaIdInfo(metaId);
      metaIdInfo = {
        ...metaIdInfo,
        ...info,
      };
    }
    return metaIdInfo;
  }

  //单独创建metaid

  public onlyCreateMetaidNode() {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const metaIdInfo: any = await this.getMetaIdInfo(this.rootAddress);
        metaIdInfo.pubKey = this._root.toPublicKey().toString();
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
          utxos = await this.provider.getUtxos(this.wallet.xpubkey.toString());
          if (!metaIdInfo.metaId) {
            // TODO: 尝试获始资金
            if (!utxos.length) {
              const initUtxo = await this.provider.getInitAmount({
                address: this.rootAddress,
                xpub: this.wallet.xpubkey.toString(),
              });
              utxos = [initUtxo];
            }

            let outputs: any[] = [];
            const rootTx = await this.createNode({
              nodeName: "Root",
              metaIdTag: "testmetaid",
              data: "NULL",
              dataType: "NULL",
              encoding: "NULL",
              utxos: utxos,
              outputs: outputs,
            });
            metaIdInfo.metaId = rootTx.txId;
            let errorMsg: any;
            // 广播
            try {
              await this.provider.broadcast(rootTx.hex!);
            } catch (error) {
              errorMsg = error;
            }
            if (errorMsg) {
              throw new Error(errorMsg.message);
            } else {
              resolve(metaIdInfo.metaId);
            }
          }
        }
      } catch (error) {}
    });
  }

  // 初始化 metaId
  public initMetaIdNode(account: BaseUserInfoTypes) {
    return new Promise<MetaIdInfoTypes>(async (resolve, reject) => {
      try {
        const metaIdInfo: any = await this.getMetaIdInfo(this.rootAddress);
        metaIdInfo.pubKey = this._root.toPublicKey().toString();
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
          const infoAddress = this.getPathPrivateKey(
            this.keyPathMap.Info.keyPath
          );
          utxos = await this.provider.getUtxos(this.wallet.xpubkey.toString());
          // 初始化 metaId
          if (!metaIdInfo.metaId) {
            // TODO: 尝试获始资金
            if (!utxos.length) {
              const initUtxo = await this.provider.getInitAmount({
                address: this.rootAddress,
                xpub: this.wallet.xpubkey.toString(),
                token: account.token || account.accessKey || "",
                userName:
                  account.userType === "phone" ? account.phone : account.email,
              });
              utxos = [initUtxo];
            }

            let outputs: any[] = [];
            if (account.referrerId) {
              outputs = [
                {
                  script: mvc.Script.buildSafeDataOut([
                    "ref:" + account.referrerId,
                  ]),
                  satoshis: 0,
                },
              ];
            }
            const root = await this.createNode({
              nodeName: "Root",
              metaIdTag: "testmetaid",
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
              metaIdTag: "testmetaid",
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
              metaIdTag: "testmetaid",
              data: "NULL",
              version: "NULL",
              utxos: utxos,
              change: infoAddress.publicKey.toAddress(this.network).toString(),
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
              metaIdTag: "testmetaid",
              data: account.name,
              utxos: utxos,
              change: infoAddress.publicKey.toAddress(this.network).toString(),
            });
            hexTxs.push(name.transaction.toString());
            metaIdInfo.name = account.name;
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
          if (!metaIdInfo[account.userType]) {
            const loginName =
              account.userType === "phone" ? account.phone : account.email;
            // const keyPath =
            //   account.userType === 'phone'
            //     ? this.keyPathMap.phone.keyPath
            //     : this.keyPathMap.email.keyPath
            // const address = this.getPathPrivateKey(keyPath)

            const loginNameTx = await this.createNode({
              nodeName: account.userType,
              parentTxId: metaIdInfo.infoTxId,
              metaIdTag: "testmetaid",
              data: loginName,
              encrypt: 1,
              utxos: utxos,
              change: infoAddress.publicKey.toAddress(this.network).toString(),
            });
            hexTxs.push(loginNameTx.transaction.toString());
            metaIdInfo[account.userType] = loginName;
            const newUtxo = await this.utxoFromTx({
              tx: loginNameTx.transaction,
              addressInfo: {
                addressType: 0,
                addressIndex: 1,
              },
            });
            if (newUtxo) utxos = [newUtxo];
          }

          // eth 绑定新 metaId 账号

          if (account.ethAddress) {
            // 先把钱打回到 infoAddress
            const transfer = await this.makeTx({
              utxos: utxos,
              opReturn: [],
              change: this.rootAddress,
              payTo: [
                {
                  amount: 1000,
                  address: infoAddress.publicKey
                    .toAddress(this.network)
                    .toString(),
                },
              ],
            });

            if (transfer) {
              hexTxs.push(transfer.toString());
              const newUtxo = await this.utxoFromTx({
                tx: transfer,
                addressInfo: {
                  addressType: 0,
                  addressIndex: 1,
                },
                outPutIndex: 0,
              });
              if (newUtxo) utxos = [newUtxo];

              // 创建 eth brfc节点 brfcId = ehtAddress
              const privateKey = this.getPathPrivateKey("0/6");
              const node: NewNodeBaseInfo = {
                address: privateKey.toAddress(this.network).toString(),
                publicKey: privateKey.toPublicKey().toString(),
                path: "0/6",
              };
              const ethBindBrfc = await this.createNode({
                nodeName: NodeName.ETHBinding,
                parentTxId: metaIdInfo.infoTxId,
                metaIdTag: "testmetaid",
                data: JSON.stringify({ evmAddress: account.ethAddress! }),
                utxos: utxos,
                change: this.rootAddress,
                node,
              });
              if (ethBindBrfc) {
                hexTxs.push(ethBindBrfc.transaction.toString());
              }
            }
          }

          let errorMsg: any;
          // 广播
          for (let i = 0; i < hexTxs.length; i++) {
            try {
              const tx = hexTxs[i];
              await this.provider.broadcast(tx);
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

  // public transferNft(
  //   params: {
  //     receiverAddress: string;
  //     codehash: string;
  //     genesis: string;
  //     tokenIndex: string;
  //     utxos?: any[];
  //   },
  //   option?: {
  //     isBroadcast: boolean;
  //   }
  // ) {
  //   return new Promise<{
  //     txHex: string;
  //     txid: string;
  //     tx: mvc.Transaction;
  //   }>(async (resolve, reject) => {
  //     const initOption = {
  //       isBroadcast: true,
  //     };
  //     option = {
  //       ...initOption,
  //       ...option,
  //     };
  //     const nftManager = await this.getNftManager();
  //     let transferParams: any = {
  //       codehash: params.codehash,
  //       genesis: params.genesis,
  //       receiverAddress: params.receiverAddress,
  //       senderWif: this.wallet!.deriveChild(0)
  //         .deriveChild(0)
  //         .privateKey.toString(),
  //       tokenIndex: params.tokenIndex,
  //       noBroadcast: !option!.isBroadcast,
  //     };
  //     if (params.utxos?.length) {
  //       transferParams = { ...transferParams, utxos: params.utxos };
  //     }
  //     const result = await nftManager.transfer(transferParams);
  //     resolve(result);
  //   });
  // }

  public sigMessage(msg: string, path = "0/0") {
    const privateKey = this.getPathPrivateKey(path);
    const message = new Message(msg);
    return message.sign(privateKey);
  }

  // 根据 path 生成 privateKey
  public getPathPrivateKey(keyPath: string) {
    const privateKey = this.wallet
      .deriveChild(+keyPath.split("/")[0])
      .deriveChild(+keyPath.split("/")[1]).privateKey;
    return privateKey;
  }

  public getPathPubliceKey(keyPath: string) {
    const privateKey = this.wallet
      .deriveChild(+keyPath.split("/")[0])
      .deriveChild(+keyPath.split("/")[1]).publicKey;
    return privateKey;
  }

  public async createNode({
    nodeName,
    payTo = [],
    utxos = [],
    change,
    metaIdTag = "testmetaid",
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
          data = this.eciesEncryptData(
            data,
            privateKey,
            privateKey.publicKey
          ).toString("hex");
        } else {
          if (encoding.toLowerCase() === "binary") {
            data = Buffer.from(data.toString("hex"), "hex");
          }
        }

        const chain = await this.provider.getTxChainInfo(parentTxId);
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
    if (!this.wallet) {
      throw new Error("Wallet uninitialized! (core-makeTx)");
    }
    const tx = new mvc.Transaction();

    // 更改 Transaction 为 Bsv  Transaction
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

  public async getOneUtxoFee(params?: { useFeeb?: number; utxo?: UtxoItem }) {
    return new Promise<number>((resolve) => {
      if (!params) params = {};
      if (!params?.useFeeb) params.useFeeb = DEFAULTS.feeb;
      const tx = new mvc.Transaction();
      tx.change(this.rootAddress);
      // @ts-ignore
      tx.from(params.utxo);
      // @ts-ignore
      const privateKeys = this.getUtxosPrivateKeys([params.utxo]);
      tx.sign(privateKeys);
      // @ts-ignore
      const amount = Math.ceil(tx._estimateSize() * params!.useFeeb!);
      resolve(amount);
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
          const res = this.session.getAddressPath(
            OutPut.script.toAddress(this.network).toString()
          );
          params.addressInfo = {
            addressType: 0,
            addressIndex: res.path,
          };
        }
        // 把Utxo 标记为已使用， 防止被其他地方用了
        this.provider.isUsedUtxos.push({
          txId: params.tx.id,
          address: OutPut.script.toAddress(this.network).toString(),
        });
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
          xpub: this.wallet.xpubkey.toString(),
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

  // 验证交易输出 TODO：地址只验证长度，后续要做合法性验证
  private isValidOutput(output: OutputTypes): boolean {
    return (
      isNaturalNumber(output.amount) && +output.amount >= DEFAULTS.minAmount
    );
  }

  /**
   * 选取足够金额的 utxos
   * @param tx
   * @param utxos 指定来源 utxo 集
   * @param amount 金额
   * @returns
   */
  public pickUtxosByAmount(
    pickedUtxos: MetasvUtxoTypes[],
    utxos: MetasvUtxoTypes[],
    amount: number
  ): PickUtxosResultTypes {
    let balance = 0;
    let unUsedInputs: MetasvUtxoTypes[] = [];
    // console.log('amount', amount)

    for (const utxo of utxos) {
      let isPicked = false;
      // 排除已经选择的 utxos
      for (const pickedItem of pickedUtxos) {
        if (
          utxo.txId === pickedItem.txId &&
          utxo.outputIndex === pickedItem.outputIndex
        ) {
          isPicked = true;
          break;
        }
      }
      if (!isPicked && !utxo.isSpend) {
        unUsedInputs = [...unUsedInputs, utxo];
      }
    }

    // utxos = unUsedInputs

    let isEnoughBalance = false;
    const newPickedUtxos: MetasvUtxoTypes[] = [];
    for (const utxo of unUsedInputs) {
      balance += Number(utxo.value);
      newPickedUtxos.push(utxo);
      // 检查是否已经足够，加 200 浮动
      if (balance > amount + DEFAULTS.minAmount + 200) {
        isEnoughBalance = true;
        break;
      }
    }
    return {
      isEnoughBalance: isEnoughBalance,
      newPickedUtxos: newPickedUtxos,
    };
  }

  public getUtxosPrivateKeys(utxos: UtxoItem[]): mvc.PrivateKey[] {
    return utxos.map((u) => {
      return this.wallet
        .deriveChild(u.addressType || 0)
        .deriveChild(u.addressIndex || 0).privateKey;
    });
  }

  /**
   * ECIES 加密
   */
  public eciesEncryptData(
    data: string | Buffer,
    privateKey?: mvc.PrivateKey,
    publicKey?: mvc.PublicKey
  ): Buffer {
    privateKey = privateKey || this.getPathPrivateKey("0/0");
    publicKey = publicKey || this.getPathPrivateKey("0/0").toPublicKey();
    //const ECIES = new mvc.ECIES();
    const ecies = ECIES().privateKey(privateKey).publicKey(publicKey);
    return ecies.encrypt(data);
  }

  /**
   * ECIES 解密
   */
  public eciesDecryptData(
    data: Buffer | string,
    privateKey?: mvc.PrivateKey | string,
    publicKey?: string
  ): string {
    privateKey = privateKey || this.getPathPrivateKey("0/0");
    publicKey = publicKey || data.toString().substring(8, 74);
    //const ECIES = new mvc.ECIES();
    let ecies = ECIES().privateKey(privateKey).publicKey(publicKey);
    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data, "hex");
    }
    let res = "";
    try {
      res = ecies.decrypt(data).toString();
    } catch (error) {
      try {
        //const ECIES = new mvc.ECIES({ noKey: true });
        ecies = ECIES({ noKey: true })
          .privateKey(privateKey)
          .publicKey(publicKey);
        res = ecies.decrypt(data).toString();
      } catch (error) {
        throw new Error("error");
      }
    }
    return res;
  }

  // 拆UTXO逻辑
  public devideUtxo(
    devides: { amount: number; address: string }[],
    utxos?: UtxoItem[],
    isBroadcast = true
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!utxos) {
          utxos = await this.provider.getUtxos(this.wallet.xpubkey.toString());
        }
        let balance = 0; // utxo 余额
        let useAmount = 50 * (devides.length - 1); // 需要花费 ： 初始转账费用50 * （n-1）
        for (const item of devides) {
          useAmount += item.amount;
        }
        for (const item of utxos) {
          balance += item.value;
        }
        if (balance < useAmount) {
          throw new Error("拆分失败，余额不足");
        }
        // 开始拆分
        const tx = await this.sendMoney({
          payTo: devides,
          utxos: utxos,
          isBroadcast,
        });
        if (tx) {
          resolve(tx);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // 批量转NFT
  /**
   *
   * @param nftList
   * {
      receiverAddress: string
      codehash: string
      genesis: string
      tokenIndex: string
      sensibleId: string
      gensisiTxid:string
    }
   * @returns
   */
  // public async batchTransferNft(
  //   NftList: any[],
  //   receiverAddress: string,
  //   noBroadcast = false
  // ) {
  //   return new Promise<PromiseSettledResult<NftTransferResult>[]>(
  //     async (resolve, reject) => {
  //       try {
  //         const utxos = await this.getUsefulUtxos(NftList.length);
  //         const transferTasks: Promise<NftTransferResult>[] = [];
  //         for (let i = 0; i < NftList.length; i++) {
  //           const transferTask = this.createTransferTask(
  //             NftList[i],
  //             utxos[i],
  //             receiverAddress,
  //             noBroadcast
  //           );

  //           transferTasks.push(transferTask);
  //         }
  //         const transferResult = await Promise.allSettled(transferTasks);

  //         resolve(transferResult);
  //       } catch (error) {
  //         reject(error);
  //       }
  //     }
  //   );
  // }

  // private async createTransferTask(
  //   nft: any,
  //   utxo: UtxoWithWif,
  //   receiverAddress: string,
  //   noBroadcast = false
  // ): Promise<NftTransferResult> {
  //   const nftManager = await this.getSensibleNftManager();

  //   return await nftManager.transfer({
  //     senderWif: this._root.toString(),
  //     receiverAddress,
  //     codehash: nft.codehash,
  //     genesis: nft.genesis,
  //     tokenIndex: String(nft.tokenIndex),
  //     utxos: [utxo],
  //     noBroadcast,
  //   });
  // }

  // 获取1000聪以上的UTXO，如果数量不足则进行拆分重组

  // public getUsefulUtxos = async (
  //   neededUtxosCount = 1
  // ): Promise<UtxoWithWif[]> => {
  //   const wallet = this.getSensibleWallet();

  //   const usefulThreshold = 1000; // 1千聪以上足够transfer花费
  //   // 先查询账号中有多少有效的utxo
  //   const allUtxos = await wallet.blockChainApi.getUnspents(this.rootAddress);
  //   const usefulUtxos = allUtxos.filter(
  //     (utxo) => utxo.satoshis >= usefulThreshold
  //   );

  //   // 如果数量大于需要tranfer的nft的数量，则返回现有的utxo
  //   if (usefulUtxos.length >= neededUtxosCount) {
  //     return this.addWifToUtxos(usefulUtxos);
  //   }

  //   // UPDATE: 如果数量不足，将多地址的utxo合并到根地址
  //   try {
  //     await this.gatherAllUtxos();
  //   } catch (e) {
  //     console.log(e);
  //   }

  //   // 如果数量不足，则执行拆分操作
  //   const balance = await wallet.blockChainApi
  //     .getBalance(this.rootAddress)
  //     .then((res: any) => res.balance + res.pendingBalance);

  //   if (balance < usefulThreshold * neededUtxosCount) {
  //     throw new Error("Space余额不足，不能进行NFT传输");
  //   }

  //   // 开始拆分
  //   const satsPerUtxo = Math.floor((balance / neededUtxosCount) * 0.9); // 留点剩余金额，不取那么极限

  //   const receivers = [];
  //   for (let i = 0; i < neededUtxosCount; i++) {
  //     receivers.push({
  //       address: this.rootAddress,
  //       amount: satsPerUtxo,
  //     });
  //   }
  //   await wallet.sendArray(receivers);

  //   const divided = await wallet.blockChainApi.getUnspents(this.rootAddress);
  //   return this.addWifToUtxos(divided);

  //   // TODO: 其他拆分策略
  // };

  // private addWifToUtxos = (utxos: SA_utxo[]): UtxoWithWif[] => {
  //   const wif = this._root.toString();
  //   return utxos.map((utxo) => {
  //     const u = utxo as UtxoWithWif;
  //     u.wif = wif;

  //     return u;
  //   });
  // };

  // private getSensibleWallet = (): Wallet => {
  //   const wallet = new Wallet(
  //     this._root.toString(),
  //     API_NET.MAIN,
  //     0.05,
  //     API_TARGET.METASV
  //   );
  //   wallet.blockChainApi.authorize({
  //     privateKey: metasvServiceSecret,
  //   });

  //   return wallet;
  // };

  // public getNftManager = (): NftManager => {
  //   const nftManager = new NftManager({
  //     apiTarget: API_TARGET.MVC,
  //     // @ts-ignore
  //     network: this.network,
  //     purse: this.wallet!.deriveChild(0).deriveChild(0).privateKey.toString(),
  //     feeb: DEFAULTS.feeb,
  //     apiHost: "https://testmvc.showmoney.app/metasv", //import.meta.env.VITE_META_SV_API,
  //   });
  //   return nftManager;
  // };

  private async gatherAllUtxos() {
    const utxosFromAll = await this.getAllAddressUtxos();
    if (
      utxosFromAll.length === 0 ||
      (utxosFromAll.length === 1 &&
        utxosFromAll[0].address === this.rootAddress)
    ) {
      return;
    }

    const tx = new mvc.Transaction();
    const fee = Math.ceil((utxosFromAll.length * 148 + 34 + 10) * 0.5);
    const totalAmount = utxosFromAll.reduce(
      (acc: number, utxo: any) => acc + utxo.value,
      0
    );
    tx.addOutput(
      new mvc.Transaction.Output({
        satoshis: totalAmount - fee,
        script: mvc.Script.fromAddress(this.rootAddress),
      })
    );

    const utxos = utxosFromAll.map((utxo: any) => {
      return {
        txId: utxo.txid,
        outputIndex: utxo.txIndex,
        satoshis: utxo.value,
        script: mvc.Script.buildPublicKeyHashOut(utxo.address).toHex(),
      };
    });
    const privateKeys = utxosFromAll.map((utxo: any) => {
      return mvc.HDPrivateKey.fromString(this.wallet.xprivkey.toString())
        .deriveChild(utxo.addressType)
        .deriveChild(utxo.addressIndex).privateKey;
    });

    tx.from(utxos);
    tx.fee(fee);
    tx.sign(privateKeys);

    const result = await this.broadcast(tx.serialize());

    return result.txid;
  }

  private async getAllAddressUtxos() {
    const xPublicKey = this.wallet.xpubkey.toString();

    return await fetch(`https://apiv2.metasv.com/xpubLite/${xPublicKey}/utxo`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJpbnRlcm5hbF90ZXN0X3Nob3dwYXkiLCJpc3MiOiJNZXRhU1YiLCJleHAiOjE2NTM4OTc0MTB9.genUip-PcA3tdQtOMKZUzwuc7XxC3zF7Vy5wdYAfKsM",
      },
    }).then((response) => {
      return response.json();
    });
  }

  private async broadcast(hex: string) {
    const response = await fetch("https://apiv2.metasv.com/tx/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJpbnRlcm5hbF90ZXN0X3Nob3dwYXkiLCJpc3MiOiJNZXRhU1YiLCJleHAiOjE2NTM4OTc0MTB9.genUip-PcA3tdQtOMKZUzwuc7XxC3zF7Vy5wdYAfKsM",
      },
      body: JSON.stringify({ hex }),
    }).then(async (response) => JSON.parse(await response.text()));

    return response;
  }

  // getter
  get userProtocols() {
    return this.userBrfcNodeList;
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
          const protocols: any = await this.getProtocols({
            protocolsTxId: protocolsTxId,
            protocolType: nodeName,
          });

          const protocol = protocols.filter((item: any) => {
            return item?.nodeName === nodeName && item?.data === brfcId;
          })[0];
          if (protocol) {
            const res = await this.session.getAddressPath(protocol.address);
            const protocolInfo = {
              xpub: this.wallet.xpubkey.toString(),
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

  // 获取协议类型数据
  async getProtocols({ protocolsTxId, protocolType }: GetProtocolsTypes) {
    return new Promise((resolve, reject) => {
      fetch(
        //import.meta.env.VITE_BASEAPI
        `${Env.BASEAPI}/serviceapi/api/v1/protocol/getProtocolDataList`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: JSON.stringify({
              protocolTxId: protocolsTxId,
              nodeName: protocolType,
            }),
          }),
        }
      )
        .then((response: Response) => {
          return response.json();
        })
        .then((json) => {
          if (json && json.code === 200 && json.result.data) {
            resolve(json.result.data);
          } else {
            resolve([]);
          }
        })
        .catch((error) => {
          reject(error);
        });
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

        const nodeName = AllNodeName[params.nodeName];

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
          const newBrfcNodeBaseInfo =
            await this.provider.getNewBrfcNodeBaseInfo(
              this.wallet.xpubkey.toString(),
              params.parentTxId
            );

          const protocolRoot = await this.createNode({
            ...params,
            metaIdTag: "testmetaid",
            data: nodeName.brfcId,
            utxos: params.utxos,
            node: newBrfcNodeBaseInfo,
            chain: option!.chain!,
          });
          if (protocolRoot) {
            if (option.isBroadcast) {
              await this.provider.broadcast(
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

  public async createBrfcChildNode(
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
          metaIdTag: "testmetaid",
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
            const response = await this.provider.broadcast(
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

  /**
   * sendMoney
   */
  public async sendMoney(params: {
    payTo: PayToItem[];
    isBroadcast?: boolean;
    opReturn?: string[];
    utxos?: UtxoItem[];
    chain?: HdWalletChain;
  }) {
    return new Promise<mvc.Transaction>(async (resolve, reject) => {
      try {
        const initParams = {
          payTo: [],
          isBroadcast: true,
          opReturn: [], //import.meta.env.VITE_App_Key
          utxos: [],
          chain: HdWalletChain.MVC,
        };
        params = {
          ...initParams,
          ...params,
        };
        if (!params.utxos!.length) {
          let totalAmount = mvc.Transaction.DUST_AMOUNT;
          for (const item of params.payTo) {
            totalAmount += item.amount;
          }
          params.utxos = await this.provider.getAmountUnUesedUtxos(
            totalAmount,
            this.wallet.xpubkey.toString(),
            params.chain
          );
        }
        for (const item of params.payTo) {
          if (!item.address) {
            throw new Error("需要指定转账地址");
          }
          if (isEmail(item.address)) {
            item.address = await this.provider.getPayMailAddress(item.address);
          }
        }
        const tx = await this.makeTx({
          payCurrency: "SPACE",
          payTo: params.payTo,
          opReturn: params.opReturn,
          utxos: params.utxos,
          chain: params!.chain,
        });
        if (params.isBroadcast) {
          const res = await this.provider.broadcast(
            tx.toString(),
            params.chain
          );
          if (res) {
            resolve(tx);
          }
        } else {
          resolve(tx);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // ftGenesis() {
  //   return new Promise(async (resolve) => {
  //     const userStore = useUserStore();
  //     const tokenName = "SPACE-MIT";
  //     const tokenSymbol = "SMIT";
  //     const decimalNum = 8;

  //     let utxos;
  //     let bFrcRes = await this.createBrfcNode(
  //       {
  //         nodeName: NodeName.FtGenesis,
  //         parentTxId: userStore.user!.protocolTxId,
  //         useFeeb: 1,
  //       },
  //       {
  //         isBroadcast: false,
  //       }
  //     );
  //     if (bFrcRes.transaction) {
  //       const allUtxos = await this.provider.getUtxos(
  //         this.wallet.xpubkey.toString()
  //       );
  //       const tx = await this.sendMoney({
  //         payTo: [{ amount: 1000, address: this.protocolAddress }],
  //         utxos: allUtxos,
  //       });
  //       const utxo = await this.utxoFromTx({
  //         tx,
  //         addressInfo: {
  //           addressType: parseInt(
  //             this.keyPathMap["Protocols"].keyPath.split("/")[0]
  //           ),
  //           addressIndex: parseInt(
  //             this.keyPathMap["Protocols"].keyPath.split("/")[1]
  //           ),
  //         },
  //         outPutIndex: 0,
  //       });
  //       utxo.wif = this.getPathPrivateKey(
  //         `${utxo.addressType}/${utxo.addressIndex}`
  //       ).toString();
  //       utxos = [utxo];
  //       bFrcRes = await this.createBrfcNode({
  //         nodeName: NodeName.FtGenesis,
  //         parentTxId: userStore.user!.protocolTxId,
  //         useFeeb: 1,
  //         utxos,
  //       });
  //     }

  //     const allUtxos = await this.provider.getUtxos(
  //       this.wallet.xpubkey.toString()
  //     );
  //     const tx = await this.sendMoney({
  //       payTo: [{ amount: 20000, address: bFrcRes.address }],
  //       utxos: allUtxos,
  //     });
  //     const utxo = await this.utxoFromTx({
  //       tx,
  //       addressInfo: {
  //         addressType: bFrcRes.addressType,
  //         addressIndex: bFrcRes.addressIndex,
  //       },
  //       outPutIndex: 0,
  //     });
  //     utxo.wif = this.getPathPrivateKey(
  //       `${utxo.addressType}/${utxo.addressIndex}`
  //     ).toString();
  //     utxos = [utxo];
  //     const response = await this.createBrfcChildNode(
  //       {
  //         nodeName: NodeName.FtGenesis,
  //         data: JSON.stringify({
  //           type: "metacontract",
  //           tokenName,
  //           tokenSymbol,
  //           decimalNum,
  //           desc: "SPACE-MIT(SMIT) is a reward token launched for the MVC Incentivized Testnet (MIT). You can swap the reward to the Mainnet coin in a specific ratio after the launch of MVC Mainnet.",
  //           icon: "metafile://37657797410a92f7ed37440ea54d2b7940c1e0acc150a86f4e677565fc8c3e05.png",
  //           website: "https://mvc.space/",
  //           issuerName: "MVC Foundation",
  //           utxos,
  //           useFeeb: 1,
  //         }),
  //         ...AllNodeName[NodeName.FtGenesis],
  //         brfcTxId: bFrcRes.txId,
  //       },
  //       {
  //         isBroadcast: false,
  //       }
  //     );

  //     const ft = new FtManager({
  //       network: this.network,
  //       feeb: 1,
  //       purse: this.getPathPrivateKey(`0/0`).toString(),
  //     });

  //     const genesis = await ft.genesis({
  //       tokenName,
  //       tokenSymbol,
  //       decimalNum,
  //       opreturnData: response.scriptPlayload,
  //       // noBroadcast: true,
  //       utxos,
  //       changeAddress: userStore.user!.address,
  //       genesisWif: this.getPathPrivateKey(`0/0`).toString(),
  //     });
  //     console.log("genesisWif", this.getPathPrivateKey(`0/0`).toString());
  //     // await this.provider.broadcast(genesis.txHex)

  //     let IssueFrfcRes = await this.createBrfcNode(
  //       {
  //         nodeName: NodeName.FtIssue,
  //         parentTxId: userStore.user!.protocolTxId,
  //         useFeeb: 1,
  //       },
  //       {
  //         isBroadcast: false,
  //       }
  //     );
  //     if (IssueFrfcRes.transaction) {
  //       const allUtxos = await this.provider.getUtxos(
  //         this.wallet.xpubkey.toString()
  //       );
  //       const tx = await this.sendMoney({
  //         payTo: [{ amount: 20000, address: this.protocolAddress }],
  //         utxos: allUtxos,
  //       });
  //       await sleep(2000);
  //       const utxo = await this.utxoFromTx({
  //         tx,
  //         addressInfo: {
  //           addressType: parseInt(
  //             this.keyPathMap["Protocols"].keyPath.split("/")[0]
  //           ),
  //           addressIndex: parseInt(
  //             this.keyPathMap["Protocols"].keyPath.split("/")[1]
  //           ),
  //         },
  //         outPutIndex: 0,
  //       });
  //       utxo.wif = this.getPathPrivateKey(
  //         `${utxo.addressType}/${utxo.addressIndex}`
  //       ).toString();
  //       utxos = [utxo];
  //       IssueFrfcRes = await this.createBrfcNode({
  //         nodeName: NodeName.FtIssue,
  //         parentTxId: userStore.user!.protocolTxId,
  //         useFeeb: 1,
  //         utxos,
  //       });
  //     }

  //     await sleep(2000);

  //     const allUtxos2 = await this.provider.getUtxos(
  //       this.wallet.xpubkey.toString()
  //     );
  //     const tx2 = await this.sendMoney({
  //       payTo: [{ amount: 20000, address: IssueFrfcRes.address }],
  //       utxos: allUtxos2,
  //     });
  //     await sleep(2000);
  //     const utxo2 = await this.utxoFromTx({
  //       tx: tx2,
  //       addressInfo: {
  //         addressType: IssueFrfcRes.addressType,
  //         addressIndex: IssueFrfcRes.addressIndex,
  //       },
  //       outPutIndex: 0,
  //     });
  //     utxo2.wif = this.getPathPrivateKey(
  //       `${utxo2.addressType}/${utxo2.addressIndex}`
  //     ).toString();
  //     utxos = [utxo2];
  //     const response2 = await this.createBrfcChildNode(
  //       {
  //         nodeName: NodeName.FtIssue,
  //         data: JSON.stringify({
  //           type: "metacontract",
  //           genesisId: genesis.genesis,
  //           sensibleId: genesis.sensibleId,
  //           tokenAmount: "30000000000000",
  //           genesisAddress: userStore.user!.address,
  //           address: userStore.user!.address,
  //           allowIncreaseIssues: true,
  //         }),
  //         ...AllNodeName[NodeName.FtIssue],
  //         brfcTxId: IssueFrfcRes.txId,
  //         utxos,
  //         useFeeb: 1,
  //       },
  //       {
  //         isBroadcast: false,
  //       }
  //     );
  //     console.log("genesisWif", this.getPathPrivateKey(`0/0`).toString());
  //     console.log({
  //       brfcAddress: bFrcRes.address,
  //       address1: utxos[0].address,
  //       address2: mvc.PrivateKey.fromWIF(utxos[0].wif)
  //         .toAddress("testnet")
  //         .toString(),
  //       path: `${utxos[0].addressType}/${utxos[0].addressIndex}`,
  //     });
  //     const result = await ft.issue({
  //       genesis: genesis.genesis,
  //       codehash: genesis.codehash,
  //       sensibleId: genesis.sensibleId,
  //       genesisWif: this.getPathPrivateKey(`0/0`).toString(),
  //       receiverAddress: userStore.user!.address,
  //       tokenAmount: "30000000000000",
  //       allowIncreaseMints: true, //if true then you can issue again
  //       opreturnData: response2.scriptPlayload,
  //       utxos,
  //       // noBroadcast: true,
  //       changeAddress: userStore.user!.address,
  //     });

  //     // await this.provider.broadcast(result.txHex)
  //   });
  // }

  //发起MetaName交易前请求
  public async MetaNameBeforeReq(params: { name: string; op: MetaNameOp }) {
    return this.provider.reqMetaNameArgs({
      ...params,
      address: this.rootAddress,
    });
  }
}
