import Request from "@/utils/request";
import Env from "@/config/config";
const aggregation = new Request(`${Env.Aggregation}`, {
  //   header: {
  //     SiteConfigMetanetId: import.meta.env.VITE_SiteConfigMetanetId,
  //   },
  responseHandel: (response) => {
    return new Promise((resolve, reject) => {
      if (response?.data && typeof response.data?.code === "number") {
        if (response.data.code === 0 || response.data.code === 601) {
          resolve(response.data);
        } else {
          reject({
            code: response.data.code,
            message: response.data.data,
          });
        }
      } else {
        resolve(response.data);
      }
    });
  },
}).request;

export const GetUserAllInfo = (
  metaId: string
): Promise<{
  code: number;
  data: UserAllInfo;
}> => {
  return aggregation.get(`/v2/app/user/getUserAllInfo/${metaId}`);
};

export const GetMetafileBySha256 = (params: {
  sha256: string;
  metaId?: string;
}): Promise<{
  code: number;
  data: {
    total: number;
    nextFlag: string;
    results: {
      items: MetaFileSha256Info[] | null;
    };
  };
}> => {
  const { sha256, ..._params } = params;
  return aggregation.get(`/v2/app/metaFile/getMetaFileByHash/${sha256}`, {
    params: _params,
  });
};
