import metasvRequst from "@/request/metasv";
import metaIdBaseRequst from "@/request/metaid-base";
import { ApiBaseParams } from "@/types/common";
import BaseApi, { BaseApiConstructorParams } from "./base";
import { BrfcInfoItem, TxConstructorParams } from "@/types/tx";
import serviceapi from "@/request/serviceapi";
import { MetasvSigTypes } from "@/types/util";
import metaSvSignature from "@/request/metaSvSignature";

export default class Util extends BaseApi {
  constructor(params: BaseApiConstructorParams) {
    super(params);
  }

  getMetaSvSignature(
    path: string,
    params?: ApiBaseParams
  ): Promise<MetasvSigTypes> {
    return new Promise(async (resolve, reject) => {
      const res = await metaSvSignature(this.getShowMoneyBaseUrl(params))
        .post("/signature", { path })
        .catch((error: any) => {
          reject(error);
        });
      if (res?.code === 0) {
        resolve(res.data as MetasvSigTypes);
      }
    });
  }
}
