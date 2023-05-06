import aggregationRequst from "@/request/aggregation";
import {
  AccountInfo,
  MetaIdConstructorParams,
  MetaIdUserInfo,
  NewNodeBaseInfo,
  MetafileBySha256,
} from "@/types/metaid";
import { ApiBaseParams } from "@/types/common";
import BaseApi from "./base";
import serviceapi from "@/request/serviceapi";

export default class MetaId extends BaseApi {
  constructor(params: MetaIdConstructorParams) {
    super(params);
  }

  getUserInfo(metaId: string, params?: ApiBaseParams) {
    return new Promise<MetaIdUserInfo>(async (resolve, reject) => {
      const res = await aggregationRequst(this.getShowMoneyBaseUrl(params))
        .get(`/v2/app/user/getUserInfo/${metaId}`)
        .catch((error: any) => {
          reject(error);
        });
      if (res?.code === 0) {
        if (res.data.evmAddress) {
          res.data.evmAddress = JSON.parse(res.data.evmAddress);
        }
        resolve(res.data);
      }
    });
  }

  getAccount(metaId: string, params?: ApiBaseParams) {
    return new Promise<AccountInfo>(async (resolve, reject) => {
      const res = await serviceapi(this.getShowMoneyBaseUrl(params))
        .post("/api/v1/showService/getOwnShowAccount", {
          data: JSON.stringify({
            showId: metaId,
          }),
        })
        .catch((error: any) => {
          reject(error);
        });
      if (res.code === 200) {
        return res.result;
      } else if (res.code === 601) {
        return null;
      }
    });
  }

  getNewBrfcNodeBaseInfo(
    xpub: string,
    parentTxId: string,
    option?: ApiBaseParams
  ) {
    return new Promise<NewNodeBaseInfo>(async (resolve, reject) => {
      const res = await serviceapi(this.getShowMoneyBaseUrl(option))
        .post("/api/v1/showService/getPublicKeyForNewNode", {
          data: JSON.stringify({ xpub, parentTxId, count: 30 }),
        })
        .catch((error: any) => {
          reject(error);
        });
      if (res.code === 200) {
        resolve(res.result.data);
      } else if (res.code === 601) {
        return null;
      }
    });
  }

  GetMetafileBySha256(
    params: { sha256: string; metaId?: string },
    option?: ApiBaseParams
  ) {
    return new Promise<MetafileBySha256 | Array<any>>(
      async (resolve, reject) => {
        const { sha256, ..._params } = params;
        const res = await aggregationRequst(this.getShowMoneyBaseUrl(option))
          .get(`/v2/app/metaFile/getMetaFileByHash/${sha256}`, {
            params: _params,
          })
          .catch((error: any) => {
            reject(error);
          });
        if (
          res.code === 0 &&
          res.data.results.items &&
          res.data.results.items.length
        ) {
          resolve(res.data.results.items);
        } else {
          resolve([]);
        }
      }
    );
  }
}
