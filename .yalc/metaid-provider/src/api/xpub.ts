import metasvRequst from "@/request/metasv";
import { ApiBaseParams } from "@/types/common";
import { UtxoItem } from "@/types/utxo";
import BaseApi from "./base";
import { XpubConstructorParams } from "@/types/xpub";
// @ts-ignore
import mvc from "mvc-lib";

export default class Xpub extends BaseApi {
  constructor(params: XpubConstructorParams) {
    super(params);
  }

  getBalance(xpub: string, params?: ApiBaseParams) {
    return new Promise<number>(async (resolve, reject) => {
      const res = await metasvRequst(
        this.getMetaSvBaseUrl(params),
        this.getShowMoneyBaseUrl(params)
      )
        .get(`/xpubLite/${xpub}/balance`)
        .catch((error: any) => {
          reject(error);
        });
      if (res) {
        resolve(res.balance);
      }
    });
  }

  getUtxo(xpub: string, params?: ApiBaseParams) {
    const utxos: UtxoItem[] = [];
    return new Promise<UtxoItem[]>(async (resolve, reject) => {
      const res = await metasvRequst(
        this.getMetaSvBaseUrl(params),
        this.getShowMoneyBaseUrl(params)
      )
        .get(`/xpubLite/${xpub}/utxo`)
        .catch((error: any) => {
          reject(error);
        });
      if (res.length) {
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
        resolve(utxos);
      }
    });
  }
}
