import serviceapiRequst from "@/request/serviceapi";
import metasvRequst from "@/request/metasv";
import { ApiBaseParams } from "@/types/common";
import { UtxoItem } from "@/types/utxo";
//@ts-ignore
import mvc from "mvc-lib";
//import { mvc } from "meta-contract";
import BaseApi from "./base";
import { AddressConstructorParams } from "@/types/address";

export default class Address extends BaseApi {
  constructor(params: AddressConstructorParams) {
    super(params);
  }

  getMetaId(address: string, params?: ApiBaseParams) {
    return new Promise<string>(async (resolve, reject) => {
      const res = await serviceapiRequst(this.getShowMoneyBaseUrl(params))
        .post("/api/v1/metago/getMetaIdByZoreAddress", {
          data: JSON.stringify({
            zeroAddress: address,
          }),
        })
        .catch((error: any) => {
          reject(error);
        });
      if (res?.code === 200) {
        resolve(res.result.rootTxId);
      } else if (res?.code === 601) {
        resolve("");
      }
    });
  }

  getUtxos(
    params: {
      address: string;
      addressIndex: number;
      addressType: number;
    },
    option?: ApiBaseParams
  ) {
    return new Promise<string>(async (resolve, reject) => {
      const res = await metasvRequst(
        this.getMetaSvBaseUrl(option),
        this.getShowMoneyBaseUrl(option)
      )
        .get(`/address/${params.address}/utxo`)
        .catch((error: any) => {
          reject(error);
        });
      if (res) {
        const utxos: UtxoItem[] = [];
        if (Array.isArray(res)) {
          res.forEach((item) => {
            item.script = mvc.Script.fromAddress(item.address).toHex();
            item.amount = +item.value / 1e8;
            item.vout = item.outIndex;
            item.txIndex = item.outIndex;
            item.satoshis = item.value;
            item.outputIndex = item.outIndex;
            item.txId = item.txid;
            item.addressIndex = params.addressIndex;
            item.addressType = params.addressType;
            utxos.push(item);
          });
        }
        return utxos;
      }
    });
  }

  getProtocols(
    protocolsTxId: string,
    protocolType: string,
    option?: ApiBaseParams
  ) {
    return new Promise<Array<any>>(async (resolve, reject) => {
      const res = await serviceapiRequst(this.getShowMoneyBaseUrl(option))
        .post("/api/v1/protocol/getProtocolDataList", {
          data: JSON.stringify({
            protocolTxId: protocolsTxId,
            nodeName: protocolType,
          }),
        })
        .catch((error: any) => {
          reject(error);
        });
      if (res.code === 200) {
        resolve(res.result.data);
      } else {
        resolve([]);
      }
    });
  }
}
