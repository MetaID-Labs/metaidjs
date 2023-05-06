import Util from "@/api/util";
import { AxiosRequestConfig } from "axios";
import HttpRequest from "request-sdk";

export default (baseUrl: string, showMoneyBaseUrl: string) =>
  new HttpRequest(`${baseUrl}`, {
    header: (config: AxiosRequestConfig) => {
      return new Promise(async (resolve, reject) => {
        const signature = await new Util({
          base: {
            showMoneyBaseUrl: `https://api.show3.io`,
          },
        })
          .getMetaSvSignature(config.url!)
          .catch((error) => {
            reject(error);
          });
        if (signature) {
          const headers = {
            ...config.headers,
            "Content-Type": "application/json",
            "MetaSV-Timestamp": signature.timestamp,
            "MetaSV-Client-Pubkey": signature.publicKey,
            "MetaSV-Nonce": signature.nonce,
            "MetaSV-Signature": signature.signEncoded,
          };
          resolve(headers);
        }
      });
    },
  }).request;
