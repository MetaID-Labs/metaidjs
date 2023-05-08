import { UtxoConstructorParams, UtxoItem } from "@/types/utxo";
import BaseApi from "./base";
import { ApiBaseParams } from "@/types/common";
import metasv from "@/request/metasv";
import Tool from "./tool";
// @ts-ignore
import mvc from "mvc-lib";
//import { mvc } from "meta-contract";

export default class Utxo extends BaseApi {
  // 已使用或准备使用的utxo
  usedUtxos: UtxoItem[] = [];

  constructor(params: UtxoConstructorParams) {
    super(params);
  }

  find(
    param: {
      xpub: string;
      minAmount?: number;
    },
    options?: ApiBaseParams
  ) {
    return new Promise(async (resolve, reject) => {
      const res = await metasv(
        this.getMetaSvBaseUrl(options),
        this.getShowMoneyBaseUrl(options)
      ).get(`/xpubLite/${param.xpub}/utxo`);
      if (res) {
        const otherUsedUtxosRes = await new Tool({
          base: {
            showMoneyBaseUrl: this.getShowMoneyBaseUrl(options),
          },
        }).getUtxos({
          page: 1,
          pageSize: 99,
        });
        const usedUtxos = [...this.usedUtxos, ...otherUsedUtxosRes[0]];
        // 过去本地已使用或准备使用的utxo
        let utxos = res.filter((item: any) => {
          if (
            usedUtxos.some(
              (_item) =>
                _item.txId === item.txid || _item.address === item.address
            )
          ) {
            return false;
          } else {
            return item;
          }
        });
        const resultUtxos: UtxoItem[] = [];
        let amount = 0;
        for (let i = 0; i < utxos.length; i++) {
          utxos[i].script = mvc.Script.fromAddress(utxos[i].address).toHex();
          utxos[i].amount = +utxos[i] / 1e8;
          utxos[i].vout = +utxos[i].txIndex;
          utxos[i].satoshis = +utxos[i].value;
          utxos[i].outputIndex = +utxos[i].txIndex;
          utxos[i].txId = +utxos[i].txid;
          resultUtxos.push(utxos[i]);
          amount += utxos.satoshis;

          if (param.minAmount && amount >= param.minAmount) {
            break;
          }
        }
        resolve(resultUtxos);
      }
    });
  }

  getInitUtxo(
    params: {
      xpub: string;
      address: string;
      token: string;
      userName: string;
    },
    option?: ApiBaseParams
  ) {
    return new Promise<UtxoItem>(async (resolve, reject) => {
      const res = await metasv(
        this.getMetaSvBaseUrl(option),
        this.getShowMoneyBaseUrl(option)
      )
        .post(
          `/nodemvc/api/v1/pri/wallet/sendInitSatsForMetaSV`,
          {
            address: params.address,
            xpub: params.xpub,
          },
          {
            headers: {
              "Content-Type": "application/json",
              accessKey: params.token,
              timestamp: new Date().getTime(),
              userName: params.userName,
            },
          }
        )
        .catch((error: any) => {
          reject(error);
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
        resolve(result);
      }
    });
  }
}
