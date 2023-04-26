import HttpRequest from "request-sdk";

export default class Request {
  request;
  constructor(
    baseUrl: string,
    params?: {
      header?: { [key: string]: any }; // 自定义 header
      errorHandel?: (error: any) => Promise<any>; // 自定义 错误处理
      responseHandel?: (response: any) => Promise<any>; // 自定义 错误处理
      timeout?: number;
      timeoutErrorMessage?: string;
    }
  ) {
    this.request = new HttpRequest(baseUrl, {
      // @ts-ignore
      timeoutErrorMessage: `Request Timeout`,
      ...params,
    }).request;
  }
}
