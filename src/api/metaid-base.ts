import HttpRequest from "@/utils/request";
import Env from "@/config/config";
const MetaIdBase = new HttpRequest(`${Env.BASEAPI}/metaid-base`, {
  header: () => {
    const userInfo = JSON.parse(window.localStorage.getItem("userInfo")!);
    if (userInfo.isAuthorized) {
      return {
        accessKey: userInfo.user!.token,
        userName: userInfo.userName!,
        timestamp: new Date().getTime(),
        metaId: userInfo.user!.metaId,
      };
    } else {
      return {};
    }
  },
  responseHandel: (response) => {
    return new Promise((resolve, reject) => {
      if (response?.data && typeof response.data?.code === "number") {
        if (response.data.code === 0) {
          resolve(response.data);
        } else {
          reject({
            code: response.data.code,
            message: response.data.msg,
          });
        }
      } else {
        resolve(response.data);
      }
    });
  },
}).request;

export const GetTx = (
  txId: string
): Promise<{
  code: number;
  data: {
    metanetId: string;
    parentAddress: string;
    parentTxId: string;
    parentData: string;
    publicKey: string;
    txId: string;
  };
}> => {
  return MetaIdBase.get(`/v1/meta/${txId}/info`);
};

export const GetTxChainInfo = (
  txId: string
): Promise<{
  code: number;
  data: {
    metanetId: string;
    txId: string;
    chainFlag: string;
  };
}> => {
  return MetaIdBase.get(`/v1/meta/${txId}/info/chain`);
};
