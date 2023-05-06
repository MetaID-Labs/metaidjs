import metasvRequst from "@/request/metasv";
import metaIdBaseRequst from "@/request/metaid-base";
import { ApiBaseParams } from "@/types/common";
import BaseApi from "./base";
import { BrfcInfoItem, TxConstructorParams, TxInfo } from "@/types/tx";
import serviceapi from "@/request/serviceapi";

export default class Tx extends BaseApi {
  chainInfos: {
    txId: string;
    chain: "meta" | "mvc";
  }[] = [];

  brfcs: BrfcInfoItem[] = [];

  constructor(params: TxConstructorParams) {
    super(params);
  }

  broadcast(hex: string, params?: ApiBaseParams) {
    return new Promise<string>(async (resolve, reject) => {
      const res = await metasvRequst(
        this.getMetaSvBaseUrl(params),
        this.getShowMoneyBaseUrl()
      )
        .post(`/tx/broadcast`, { hex })
        .catch((error: any) => {
          reject(error);
        });
      if (res?.txid) {
        await this.sendRawTx(hex);
        resolve(res?.txid);
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

  private async sendRawTx(hex: string, params?: ApiBaseParams): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      const res = await metaIdBaseRequst(this.getShowMoneyBaseUrl(params))
        .post("/v1/meta/upload/raw", {
          raw: hex,
          type: 1,
        })
        .catch((error: any) => {
          reject(error);
        });
      if (res) {
        resolve(res);
      }
    });
  }

  getChain(txId: string, params: ApiBaseParams) {
    return new Promise<"mvc" | "meta">(async (resolve, reject) => {
      const item = this.chainInfos.find((item) => item.txId === txId);
      if (item) {
        resolve(item.chain);
        return;
      } else {
        const res = await metaIdBaseRequst(this.getShowMoneyBaseUrl(params))
          .get(`/v1/meta/${txId}/info/chain`)
          .catch((error: any) => {
            reject(error);
          });
        if (res?.code === 0) {
          resolve(res.data.chainFlag || "mvc");
        }
      }
    });
  }

  getBrfcs(
    params: { nodename: string; protocolTxId: string },
    option?: ApiBaseParams
  ) {
    return new Promise<BrfcInfoItem[]>(async (resolve, reject) => {
      const res = await serviceapi(this.getMetaSvBaseUrl(option))
        .post("/api/v1/protocol/getProtocolDataList", {
          data: JSON.stringify({
            protocolTxId: params.protocolTxId,
            nodeName: params.nodename,
          }),
        })
        .catch((error: any) => {
          reject(error);
        });
      if (res.code === 200) {
        resolve(res.result.data || []);
      }
    });
  }

  getBrfc(
    params: { nodename: string; protocolTxId: string; brfcId: string },
    option?: ApiBaseParams
  ) {
    return new Promise<BrfcInfoItem>(async (resolve, reject) => {
      try {
        let brfc = this.brfcs.find(
          (item) =>
            item.nodeName === params.nodename &&
            item.parentTxId === item.parentTxId &&
            item.data === params.brfcId
        );
        if (!brfc) {
          const brfcs = await (
            await this.getBrfcs(params, option)
          ).filter((item) => item.data === params.brfcId);
          brfc = brfcs[0];
          if (brfc) {
            this.brfcs.push(brfc);
          }
        }
        resolve(brfc);
      } catch (error) {
        reject(error);
      }
    });
  }

  getTx(txId: string, option?: ApiBaseParams) {
    return new Promise<TxInfo>(async (resolve, reject) => {
      const res = await metaIdBaseRequst(this.getShowMoneyBaseUrl(option))
        .get(`/v1/meta/${txId}/info`)
        .catch((error: any) => {
          reject(error);
        });
      if (res?.code === 0) {
        resolve(res.data);
      }
    });
  }
}
