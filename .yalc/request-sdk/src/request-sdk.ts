/*
 * @Author: lgs lgs18924946920@showpay.top
 * @Date: 2023-03-13 13:41:07
 * @LastEditors: lgs lgs18924946920@showpay.top
 * @LastEditTime: 2023-04-21 17:51:02
 * @FilePath: \request-sdk\src\request-sdk.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { AxiosResponse, AxiosInstance } from "axios";
const axios = require("axios");
export default class HttpRequest {
  request: AxiosInstance;
  constructor(
    baseUrl: string,
    params?: {
      header?: { [key: string]: any }; // 自定义 header
      errorHandel?: (error: any) => Promise<any>; // 自定义 错误处理
      responseHandel?: (response: AxiosResponse) => Promise<any>; // 自定义 错误处理
      timeout?: number;
      timeoutErrorMessage?: string;
    }
  ) {
    this.request = axios.create({
      baseURL: baseUrl,
      timeout: params?.timeout ? params?.timeout : 30000,
      timeoutErrorMessage: params?.timeoutErrorMessage
        ? params?.timeoutErrorMessage
        : "请求超时，请稍后再试",
    });
    this.request.interceptors.request.use(
      async (config) => {
        if (params?.header) {
          let header;
          if (typeof params.header === "function") header = params.header();
          else header = params.header;

          for (const i in header) {
            if (!config.headers) {
              // @ts-ignore
              config.headers = {};
            }
            if (typeof header[i] === "function") {
              config.headers[i] = header[i]();
            } else {
              config.headers[i] = header[i];
            }
          }
        }

        return config;
      },
      function (error: any) {
        // 对请求错误做些什么
        return Promise.reject(error);
      }
    );
    // 添加响应拦截器
    this.request.interceptors.response.use(
      async function (response: any) {
        // 对响应数据做点什么
        if (params?.responseHandel) {
          return await params.responseHandel(response);
        } else {
          return response.data;
        }
      },
      function (error: any) {
        if (params?.errorHandel) {
          return params.errorHandel(error);
        } else {
          return Promise.reject(error);
        }
      }
    );
  }
}
