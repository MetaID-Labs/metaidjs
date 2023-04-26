/* eslint-disable @typescript-eslint/no-explicit-any */
// import ENV from '@/configs/env'
/**
 * @description: 枚举出请求数据格式类型
 * @param {type} 枚举类型
 * @return:
 */
export enum ContentType {
  json = "application/json;charset=UTF-8",
  form = "application/x-www-form-urlencoded; charset=UTF-8",
}
/**
 * @description: 枚举 request 请求的 method 方法
 * @param {type} 枚举类型
 * @return:
 */
enum HttpMethod {
  get = "GET",
  post = "POST",
}

/**
 * @description: 声明请求头 header 的类型
 * @param {type}
 * @return:
 */
interface Header {
  Accept?: string;
  "Content-Type": string;
  [propName: string]: any;
}
/**
 * @description: 声明 fetch 请求参数配置
 * @param {type}
 * @return:
 */
interface ReqConfig {
  method?: string;
  credentials?: string;
  headers?: Header;
  body?: any;
}
interface Http {
  getFetch<R, P>(url: string, params?: P, options?: RequestInit): Promise<R>;
  // getFetchJsonp<R,P>(url: string, params?:P, options?:RequestInit): Promise<R>;
  postFetch<R, P>(url: string, params?: P): Promise<R>;
}
export interface ApiRequestTypes {
  // method: string;
  url: string;
  apiPrefix?: string;
  options?: ReqConfig;
  params?: any;
}
export interface ApiParamsTypes {
  a: string; // jwt token
  n: number; // 随机数
  t: number; // 时间戳
  d?: unknown; // 参数
}

export class HttpRequests implements Http {
  public handleUrl =
    (url: string) =>
    (params: ObjTypes<any>): string => {
      if (params && typeof params === "object") {
        const paramsArray: string[] = [];
        Object.keys(params).forEach((key) =>
          paramsArray.push(key + "=" + encodeURIComponent(params[key]))
        );
        if (url.search(/\?/) === -1) {
          url += "?" + paramsArray.join("&");
        } else {
          url += "&" + paramsArray.join("&");
        }
      }
      return url;
    };

  public async getFetch<R, P>(
    url: string,
    params?: P,
    options?: RequestInit
  ): Promise<R> {
    return new Promise(async (resolve, reject) => {
      options = {
        method: HttpMethod.get,
        credentials: "omit",
        headers: {
          "Content-Type": ContentType.json,
        },
        ...options,
      };
      const res = await fetch(this.handleUrl(url)(params || {}), options)
        .then<R>((response: any) => {
          if (response.ok) {
            return response.json();
          } else {
            // alert("服务器繁忙，请稍后再试！");
          }
        })
        .then<R>((response) => {
          // response.code：是与服务器端约定 code：200 表示请求成功，非 200 表示请求失败，message：请求失败内容
          if (response) {
            return response;
          } else {
            // 非 200，错误处理
            return response;
          }
        })
        .catch((error) => {
          reject(error);
        });
      if (res) {
        resolve(res);
      }
    });
  }

  public async postFetch<R, P = ObjTypes<any>>(
    url: string,
    params?: P,
    config?: ReqConfig
  ): Promise<R> {
    // const formData = new FormData()
    const formBody: string[] = [];
    if (typeof params === "object") {
      // Object.keys(params).forEach((key) => formData.append(key, params[key]))
      Object.keys(params).forEach((key) => {
        const encodeKey = encodeURIComponent(key);
        const encodeValue = encodeURIComponent(params[key]);
        formBody.push([encodeKey, encodeValue].join("="));
      });
    }
    const options = {
      method: HttpMethod.post,
      // credentials: 'include',
      headers: Object.assign(
        {
          "Content-Type": ContentType.json,
        },
        config?.headers
      ),
      body: JSON.stringify(params),
    };
    if (options.headers["Content-Type"] === ContentType.form) {
      options.body = formBody.join("&");
    }
    const res = await fetch(url, options)
      .then<R>(async (response: any) => {
        if (response.ok) {
          // 返回数字精度处理
          const resText = await response.text();
          const fmtText = resText.replace(
            /("[^"]*"\s*:\s*)(\d{16,})/g,
            '$1"$2"'
          );
          return JSON.parse(fmtText);
        } else {
          // console.log(response)
          // alert("服务器繁忙，请稍后再试；\r\nCode:" + response.status);
          // Vue.toasted.error('服务器繁忙，请稍后再试；\r\nCode:' + response.status)
          // throw new CustomError(response.status, response)
        }
      })
      .then<R>((response) => {
        // response.code：是与服务器端约定 code：200 表示请求成功，非 200 表示请求失败，message：请求失败内容
        // console.log(response)
        return response;
      })
      .catch<R>((error) => {
        console.log("request error:", error);
        return error;
      });
    return res;
  }
}
