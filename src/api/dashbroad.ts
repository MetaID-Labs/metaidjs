import Request from "@/utils/request";
import Env from "@/config/config";
const Dashbroad = new Request(`${Env.Dashbroad}`, {
  header: () => {
    const userInfo = JSON.parse(window.localStorage.getItem("userInfo")!);
    if (userInfo.isAuthorized) {
      return {
        accessKey: userInfo.user?.token,
        userName: userInfo.userName,
        timestamp: new Date().getTime(),
      };
    } else {
      return {};
    }
  },
  errorHandel: (error: any) => {
    if (
      error.response &&
      error.response.data &&
      error.response.data.message !== ""
    ) {
      return Promise.reject({
        code: error.response.data.statusCode,
        message: error.response.data.message,
      });
    } else {
      // 对响应错误做点什么
      return Promise.reject(error);
    }
  },
}).request;

export const CreateBroadcastTask = (params: {
  txId: string;
  metaId: string;
  hex: string;
  protocol: string;
  broadcastAt: string;
  utxo: {
    txId: string;
    metaId: string;
    outputIndex: number;
    addressIndex: number;
    addressType: number;
    satoshis: number;
    script: string;
    address: string;
    wif: string;
  };
}): Promise<apiResponse> => {
  return Dashbroad.post("/broadcast-tasks", params);
};
export const BroadcastTasks = (params: {
  page: number;
  pageSize: number;
  protocol: string;
}): Promise<[BroadcastTaskItem[], number]> => {
  return Dashbroad.get("/broadcast-tasks", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      where: {
        protocol: params.protocol,
      },
    },
  });
};

export const Utxos = (params?: {
  page?: number;
  pageSize?: number;
  order?: string;
}): Promise<[UtxoItem[], number]> => {
  return Dashbroad.get("/utxos", { params });
};
