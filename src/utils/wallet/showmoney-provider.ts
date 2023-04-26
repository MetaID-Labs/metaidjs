// @ts-ignore
import mvc from "mvc-lib";
import { HttpRequests, ApiRequestTypes } from "@/utils/wallet/request2";
import HttpRequest from "request-sdk";
import axios, { AxiosInstance } from "axios";
import zlib from "zlib";
import { GetTxChainInfo } from "@/api/metaid-base";
import { Session } from "./session";
import { Utxos } from "@/api/dashbroad";
import { Network, HdWalletChain, MetaNameReqType, Chains } from "@/enum";
interface BaseApiResultTypes<T> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
  result?: T;
}
interface MetaSvAuthorizationOption {
  authorization?: string;
  privateKey?: string;
}
interface MetasvSigTypes {
  signEncoded: string;
  publicKey: string;
  nonce: string;
  timestamp: string;
}
export interface InitUtxoTypes {
  txId: string;
  index: string;
  amount: number;
  scriptPubkey: string;
  broadcast: string;
}

interface AccountInfo {
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
interface GetBalanceData {
  address: string;
  confirmed: number;
  unconfirmed: number;
}

const MVCMetaSvMirror = {
  [Network.testnet]: "https://api-mvc-testnet.metasv.com",
  [Network.mainnet]: "https://api-mvc.metasv.com",
};

const BSVMetaSvMirror = {
  [Network.testnet]: "https://apiv2.metasv.com",
  [Network.mainnet]: "https://apiv2.metasv.com",
};

export default class ShowmoneyProvider {
  public apiPrefix: string = "https://testmvc.showmoney.app"; //import.meta.env.VITE_BASEAPI;
  public metaSvApi: string = "https://testmvc.showmoney.app/metasv"; //import.meta.env.VITE_META_SV_API;
  public bsvMetaSvApi: string = "https://api.showmoney.app/metasv"; //import.meta.env.VITE_BSV_META_SV_API;
  public metaSvHttp;
  public metasvSignatureHttp;
  public serviceHttp;
  public network = Network.mainnet;
  public metaNameApi = `http://47.242.27.95:35000`;
  public newBrfcNodeBaseInfoList: NewBrfcNodeBaseInfo[] = [];
  public isUsedUtxos: { txId: string; address: string }[] = [];
  public session: Session;

  constructor(params: {
    baseApi?: string;
    mvcMetaSvApi?: string;
    bsvMetaSvApi?: string;
    network?: Network;
    session: Session;
  }) {
    this.session = params.session;
    if (params?.baseApi) this.apiPrefix = params.baseApi;
    if (params?.mvcMetaSvApi) this.metaSvApi = params.mvcMetaSvApi;
    if (params?.bsvMetaSvApi) this.bsvMetaSvApi = params.bsvMetaSvApi;
    if (params?.network) this.network = params.network;

    this.metaSvHttp = new HttpRequest(this.metaSvApi).request;
    this.serviceHttp = new HttpRequest(this.apiPrefix + "/serviceapi").request;
    // 初始化 metasv签名接口 http
    // this.metasvSignatureHttp = new HttpRequest(this.apiPrefix + '/metasv-signature', {
    this.metasvSignatureHttp = new HttpRequest(
      "https://api.showmoney.app/metasv-signature",
      {
        responseHandel(response) {
          return new Promise((resolve, reject) => {
            if (response.data.code && response.data.code !== 0) {
              // eslint-disable-next-line prefer-promise-reject-errors
              reject({
                message: response.data.msg,
                data: response.data,
              });
            } else {
              resolve(response.data);
            }
          });
        },
      }
    ).request;
  }

  private async callMetaNameApi<T = any>(
    config: ApiRequestTypes
  ): Promise<BaseApiResultTypes<T>> {
    const Http = new HttpRequests();
    const url = this.metaNameApi + config.url;
    try {
      const res = await Http.postFetch<any>(url, config.params, config.options);
      return res;
    } catch (error) {
      throw new Error("Network Error: " + error.msg);
    }
  }

  private async callApi<T = any>(
    config: ApiRequestTypes
  ): Promise<BaseApiResultTypes<T>> {
    const Http = new HttpRequests();
    const url = this.apiPrefix + config.url;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await Http.postFetch<any>(url, config.params, config.options);
      return res;
    } catch (error) {
      throw new Error("Network Error: " + error.message);
    }
  }

  //发起MetaName交易前置请求
  public async reqMetaNameArgs(params: {
    name: string;
    address: string;
    op: number;
  }) {
    let options = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await this.callMetaNameApi({
      url: "/reqargs",
      params: {
        ...params,
        source: "show",
      },
      options,
    });
    return res;
  }

  public gzip(data: Buffer | string): Promise<Buffer | string> {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, {}, (err, val) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(val);
      });
    });
  }

  public async registerNewMetaName(
    params: MetaNameRequestDate,
    reqTypes: MetaNameReqType
  ) {
    let options = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const compressData = await this.gzip(JSON.stringify(params));
    try {
      const res = await this.callMetaNameApi({
        url: `/${reqTypes}`,
        params: compressData,
        options,
      });

      if (res.code == 0) {
        return res;
      } else {
        throw new Error(`registerNewMetaName error: ${res.msg},
        requestIndex: ${params.requestIndex},
        mvcOutputIndex: ${params.mvcOutputIndex}`);
      }
    } catch (error) {
      throw new Error(`registerNewMetaName error: ${(error as any).toString()},
                 requestIndex: ${params.requestIndex},
                 mvcOutputIndex: ${params.mvcOutputIndex}`);
    }
  }

  private getMetasvSig(path: string): Promise<MetasvSigTypes> {
    return new Promise(async (resolve, reject) => {
      const res = await this.metasvSignatureHttp
        .post("/signature", { path })
        .catch((error) => reject(error));
      if (res?.code === 0) {
        resolve(res.data as MetasvSigTypes);
      }
    });
  }

  async callMetasvApi(
    path: string,
    params: ObjTypes<string | number> = {},
    method = "get",
    chain: HdWalletChain = HdWalletChain.MVC
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const signature = await this.getMetasvSig(path);
        const headers = {
          "Content-Type": "application/json",
          "MetaSV-Timestamp": signature.timestamp,
          "MetaSV-Client-Pubkey": signature.publicKey,
          "MetaSV-Nonce": signature.nonce,
          "MetaSV-Signature": signature.signEncoded,
        };
        const origin =
          chain === HdWalletChain.MVC ? this.metaSvApi : this.bsvMetaSvApi;
        const url = `${origin}${path}`;
        const Http = new HttpRequests();
        let res;
        try {
          if (method === "get") {
            res = await Http.getFetch(url, params, { headers });
          } else {
            res = await Http.postFetch(url, params, { headers });
          }
        } catch (error) {
          const mirror =
            chain === HdWalletChain.MVC ? MVCMetaSvMirror : BSVMetaSvMirror;
          if (mirror[this.network] === origin) {
            throw error;
          } else {
            const mirrorUrl = mirror[this.network] + path;
            if (method === "get") {
              res = await Http.getFetch(mirrorUrl, params, { headers });
            } else {
              res = await Http.postFetch(mirrorUrl, params, { headers });
            }
          }
        }
        if (res) {
          resolve(res);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public async getMetaId(rootAddress: string): Promise<string | null> {
    const res = await this.callApi({
      url: "/serviceapi/api/v1/metago/getMetaIdByZoreAddress",
      params: {
        data: JSON.stringify({
          zeroAddress: rootAddress,
        }),
      },
    });
    if (res.code === 200) {
      const result = res.result as ObjTypes<string>;
      return result.rootTxId;
    } else if (res.code === 601) {
      return null;
    } else {
      throw new Error("无法获取 MetaID");
    }
  }

  public async getMetaAccount(metaId: string): Promise<AccountInfo | null> {
    const res = await this.callApi({
      url: "/serviceapi/api/v1/showService/getOwnShowAccount",
      params: {
        data: JSON.stringify({
          showId: metaId,
        }),
      },
    });
    if (res.code === 200) {
      return res.result as AccountInfo;
    } else if (res.code === 601) {
      return null;
    } else {
      throw new Error("无法获取 MetaID");
    }
  }

  public async getMetaIdInfo(metaId: string): Promise<any> {
    const Http = new HttpRequests();
    const url =
      this.apiPrefix + `/aggregation/v2/app/user/getUserInfo/${metaId}`;
    const res = await Http.getFetch<BaseApiResultTypes<unknown>, any>(url);
    if (res.code === 0) {
      return res.data;
    }
  }

  public async getInitAmount(params: {
    address: string;
    xpub: string;
    token?: string;
    userName?: string;
  }): Promise<BaseUtxo> {
    let options = {
      headers: {
        "Content-Type": "application/json",
        accessKey: params?.token,
        timestamp: new Date().getTime() + "",
        userName: params?.userName,
      },
    };
    const res = await this.callApi({
      url: "/nodemvc/api/v1/pri/wallet/sendInitSatsForMetaSV",
      params: {
        address: params.address,
        xpub: params.xpub,
      },
      options: params?.token ? options : {},
    });
    if (res.code === 0) {
      const initUtxo = res.result || {};
      let result = {
        ...initUtxo,
        outputIndex: +initUtxo.index,
        satoshis: +initUtxo.amount,
        value: +initUtxo.amount,
        amount: +initUtxo.amount * 1e-8,
        address: initUtxo.toAddress,
        script: initUtxo.scriptPubkey,
        addressType: 0,
        addressIndex: 0,
      };
      console.log("resultresult", result);
      return result;
    } else {
      throw new Error(res.msg);
    }
  }

  public async getAmountUnUesedUtxos(
    amount: number,
    xpub: string,
    chain: HdWalletChain = HdWalletChain.MVC
  ) {
    return new Promise<UtxoItem[]>(async (resolve, reject) => {
      try {
        let unUsedUtxos: UtxoItem[] = [];
        let leftAmount = amount;
        const utxos = await this.getUtxos(xpub, chain);
        for (let i = 0; i < utxos.length; i++) {
          if (leftAmount > 0) {
            // utxo 未使用
            if (
              !this.isUsedUtxos.some(
                (item) =>
                  item.txId === utxos[i].txId &&
                  item.address === utxos[i].address
              )
            ) {
              unUsedUtxos.push(utxos[i]);
              leftAmount -= utxos[i].satoshis;
            }
          } else {
            break;
          }
        }
        if (leftAmount > 0) {
          // @ts-ignore
          throw new Error(chain.toUpperCase() + " " + "Insufficient balance");
        } else {
          resolve(unUsedUtxos);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public async getUtxos(
    xpub: string,
    chain: HdWalletChain = HdWalletChain.MVC
  ): Promise<UtxoItem[]> {
    let res = await this.callMetasvApi(
      `/xpubLite/${xpub}/utxo`,
      {},
      "get",
      chain
    );
    // const getUseReadyUtxoRes = await Utxos({ pageSize: 50 });
    // if (getUseReadyUtxoRes[0].length) {
    //   res = res.filter((item: any) => {
    //     if (
    //       getUseReadyUtxoRes[0].some(
    //         (_item) =>
    //           _item.txId === item.txid || _item.address === item.address
    //       )
    //     ) {
    //       return false;
    //     } else {
    //       return item;
    //     }
    //   });
    // }
    const utxos: UtxoItem[] = [];
    res.forEach((item: any) => {
      item.script = mvc.Script.fromAddress(item.address).toHex();
      item.amount = +item.value / 1e8;
      item.vout = item.txIndex;
      // sensible need satoshis,outputIndex,txId
      item.satoshis = item.value;
      item.outputIndex = item.txIndex;
      item.txId = item.txid;
      utxos.push(item);
    });
    return utxos;
  }

  public getXpubBalance(
    xpub: string,
    chain = HdWalletChain.MVC
  ): Promise<number> {
    return new Promise(async (resolve, reject) => {
      const res = await this.callMetasvApi(
        `/xpubLite/${xpub}/balance`,
        {},
        "get",
        chain
      ).catch((error) => {
        reject(error);
      });
      if (res) {
        resolve(res.balance);
      }
    });
  }

  public async getAddressUtxos(params: {
    address: string;
    flag?: string;
    xpub: string;
    addressIndex: number;
    addressType: number;
  }): Promise<BaseUtxo[]> {
    const res = await this.callMetasvApi(`/address/${params.address}/utxo`);
    const utxos: BaseUtxo[] = [];
    if (Array.isArray(res)) {
      res.forEach((item) => {
        item.script = mvc.Script.fromAddress(item.address).toHex();
        item.amount = +item.value / 1e8;
        item.vout = item.outIndex;
        item.txIndex = item.outIndex;
        // sensible need satoshis,outputIndex,txId
        item.satoshis = item.value;
        item.outputIndex = item.outIndex;
        item.txId = item.txid;
        item.xpub = params.xpub;
        item.addressIndex = params.addressIndex;
        item.addressType = params.addressType;
        utxos.push(item);
      });
    }
    return utxos;
  }

  public async getXpubLiteAddressInfo(
    xpub: string,
    address: string,
    chain = HdWalletChain.MVC
  ): Promise<{
    xpub: string;
    address: string;
    addressType: number;
    addressIndex: number;
  }> {
    return new Promise(async (resolve, reject) => {
      const res = await this.callMetasvApi(
        `/xpubLite/${xpub}/address/${address}`,
        {},
        "get",
        chain
      ).catch((err) => {
        reject(err);
      });
      if (res) {
        resolve(res);
      }
    });
  }

  // public

  public async broadcast(
    txHex: string,
    chain: HdWalletChain = HdWalletChain.MVC
  ) {
    return new Promise<{
      txid: string;
    }>(async (resolve, reject) => {
      const res = await this.callMetasvApi(
        "/tx/broadcast",
        {
          hex: txHex,
        },
        "post",
        chain
      ).catch((error) => {
        // 广播容错，忽略返回
        // this.sendRawTx(txHex)
        reject(error);
      });
      if (res?.txid) {
        await this.sendRawTx(txHex);
        resolve(res);
      } else {
        let message =
          typeof res.message === "string"
            ? res.message
            : JSON.parse(res.message).message;
        reject({
          message: message,
        });
      }
    });
  }

  // 上报RawTx
  public async sendRawTx(txHex: string): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      const sendRawTx = () => {
        return axios.post(this.apiPrefix + "/metaid-base/v1/meta/upload/raw", {
          raw: txHex,
          type: 1,
        });
      };
      // const sendRawTxUtxo = () => {
      //   return axios.post(this.apiPrefix + '/utxo/sendRawTx', {
      //     raw: txHex,
      //     unCheck: false.toString(),
      //   })
      // }
      const res = await Promise.all([sendRawTx()]);
      resolve(res);
    });
  }

  public async getNftGenesisInfo(sensibleId: string): Promise<any> {
    const Http = new HttpRequests();
    const url =
      this.apiPrefix +
      `/aggregation/v2/app/sensible/getNftGenesisByTxId/${sensibleId}`;
    const res = await Http.getFetch<BaseApiResultTypes<unknown>, any>(url);
    if (res.code === 0) {
      return res.data;
    }
  }

  async getPayMailAddress(email: string) {
    return new Promise<string>(async (resolve, reject) => {
      const res: any = await axios
        .post("https://api.showmoney.app" + "/paymail/v2/paymail/address", {
          Email: email,
        })
        .catch((error) => {
          if (error.response?.data?.data) {
            reject({
              code: error.response.data.code,
              message: error.response.data.data,
            });
          } else {
            reject(error);
          }
        });
      if (res?.data?.code === 0) {
        resolve(res.data.data);
      }
    });
  }

  async getNewBrfcNodeBaseInfo(xpub: string, parentTxId: string) {
    return new Promise<NewNodeBaseInfo>(async (resolve, reject) => {
      let node = this.newBrfcNodeBaseInfoList.find(
        (item) => !item.isUsed && item.parentTxId === parentTxId
      );

      if (!node) {
        const res: any = await this.serviceHttp
          .post("/api/v1/showService/getPublicKeyForNewNode", {
            data: JSON.stringify({ xpub, parentTxId, count: 30 }),
          })
          .catch((error) => reject(error));
        if (res?.code === 200) {
          for (let item of res.result.data) {
            this.newBrfcNodeBaseInfoList.push({
              ...item,
              parentTxId,
            });
          }
          node = this.newBrfcNodeBaseInfoList.find(
            (item) => !item.isUsed && item.parentTxId === parentTxId
          );
        } else {
          reject({
            code: res.code,
            message: res.error,
          });
        }
      }
      node!.isUsed = true;
      resolve(node!);
    });
  }

  getPathWithNetWork(params: {
    xpub: string;
    address: string;
    chain?: HdWalletChain;
  }) {
    return new Promise<{
      address: string;
      addressIndex: number;
      addressType: number;
      xpub: string;
    }>(async (resolve, reject) => {
      if (!params.chain) params.chain = HdWalletChain.MVC;
      const res = await this.callMetasvApi(
        `/xpubLite/${params.xpub}/address/${params.address}`,
        {},
        "get",
        params.chain
      ).catch((error) => reject(error));
      if (res) {
        resolve(res);
      }
    });
  }

  getTxChainInfo(txId: string) {
    return new Promise(async (resolve, reject) => {
      const item = this.session.txChainInfos.find((item) => item.txId === txId);
      if (item) {
        resolve(item.chain);
        return;
      } else {
        const chainInfoRes = await GetTxChainInfo(txId);
        const chain =
          chainInfoRes.code === 0 && chainInfoRes.data.chainFlag
            ? chainInfoRes.data.chainFlag
            : Chains.MVC;
        this.session.addTxChainInfo({
          txId,
          chain,
        });
        resolve(chain);
      }
    });
  }
}
