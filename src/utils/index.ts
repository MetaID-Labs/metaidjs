// @ts-ignore
//import { mvc } from "meta-contract";
import mvc from "mvc-lib";
// @ts-ignore
import { Utf8 } from "crypto-es/lib/core.js";
// @ts-ignore
import { AES } from "crypto-es/lib/aes.js";
// @ts-ignore
import { CBC, Pkcs7 } from "crypto-es/lib/cipher-core.js";
// @ts-ignore
import { MD5 } from "crypto-es/lib/md5.js";
// @ts-ignore
import { SHA256 } from "crypto-es/lib/sha256.js";
// @ts-ignore
import Ripemd128 from "ripemd128-js/ripemd128.js";
import * as bip39 from "bip39";
// @ts-ignore
import * as ECIES from "mvc-lib/ecies";
import { Network } from "@/enum";
import englishWords from "@/utils/wallet/englishWord";
import Env from "@/config/config";
import Compressor from "compressorjs";
// @ts-ignore
import CryptoJs from "crypto-js";
// @ts-ignore
import encHex from "crypto-js/enc-hex";
// 是否邮箱
export function isEmail(email = "") {
  const emailReg = new RegExp(
    "^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(.[a-zA-Z0-9_-]+)+$"
  );
  return emailReg.test(email);
}

export const isNaturalNumber = (n: number | string): boolean => {
  n = n.toString();
  const n1 = Math.abs(Number(n));
  const n2 = parseInt(n, 10);
  return !isNaN(n1) && n2 === n1 && n1.toString() === n;
};

// AES 解密
export const aesDecrypt = (encryptedStr: string, key: string): string => {
  key = key.length > 16 ? key.padEnd(32, "0") : key.padEnd(16, "0");
  const iv = "0000000000000000";
  const utf8Key = Utf8.parse(key);
  const utf8Iv = Utf8.parse(iv);
  let bufferData;
  try {
    bufferData = Buffer.from(encryptedStr.toString(), "hex");
  } catch {
    return encryptedStr;
  }
  const base64Str = bufferData.toString("base64");
  const bytes = AES.decrypt(base64Str, utf8Key, {
    iv: utf8Iv,
    mode: CBC,
    padding: Pkcs7,
  });
  return bytes.toString(Utf8);
};

// 解密助记词
export const decryptMnemonic = (
  encryptedMnemonic: string,
  password: string
): string => {
  const mnemonic = aesDecrypt(encryptedMnemonic, password);
  return mnemonic.split(",").join(" ");
};

export const hdWalletFromMnemonic = async (
  mnemonic: string,
  tag: "new" | "old" = "new",
  network: Network = Network.mainnet,
  path: string | number = Env.WalletPath //import.meta.env.VITE_WALLET_PATH
): Promise<mvc.HDPrivateKey> => {
  // const hdPrivateKey = Mnemonic.fromString(mnemonic).toHDPrivateKey()
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const hdPrivateKey = mvc.HDPrivateKey.fromSeed(seed, network);
  console.log("hdPrivateKey", hdPrivateKey);
  const hdWallet = hdPrivateKey.deriveChild(`m/44'/${path}'/0'`);
  return hdWallet;
};

export const hdWalletFromAccount = async (
  account: BaseUserInfoTypes,
  network: Network = Network.mainnet,
  path: string | number = Env.WalletPath
): Promise<{
  mnemonic: string;
  wallet: mvc.HDPrivateKey;
  rootAddress: string;
  rootWif: string;
  network: Network;
}> => {
  // console.log(account)
  const loginName =
    account.userType === "phone" ? account.phone : account.email;
  const password = account.password;

  // console.log('account', account)
  if (!loginName || !password) {
    throw new Error("参数错误");
  }
  let mnemonic: string;
  if (account.enCryptedMnemonic) {
    mnemonic = decryptMnemonic(account.enCryptedMnemonic, password);
  } else {
    // 根据用户名、密码和 pk2 生成助记词
    const ppBuffer = Buffer.from([loginName, password].join("/"));
    const ppHex = mvc.crypto.Hash.sha256(ppBuffer).toString("hex");
    let hex: string | Buffer;
    if (account.tag === "old") {
      hex = Buffer.from(ppHex + account.pk2);
      hex = mvc.crypto.Hash.sha256sha256(hex).toString("hex");
    } else {
      hex = Buffer.from((ppHex + account.pk2).toLowerCase(), "hex").toString(
        "hex"
      );
      hex = Ripemd128(hex).toString();
    }
    mnemonic = bip39.entropyToMnemonic(hex, englishWords);
  }
  // const mnemonic = new Mnemonic(Buffer.from(hex)).toString()
  const wallet = await hdWalletFromMnemonic(
    mnemonic,
    account.tag,
    network,
    path
  );

  const root = wallet.deriveChild(0).deriveChild(0).privateKey;
  console.log({
    mnemonic: mnemonic,
    wallet: wallet,
    rootAddress: root.toAddress(network).toString(),
    rootWif: root.toString(),
    network,
  });
  return {
    mnemonic: mnemonic,
    wallet: wallet,
    rootAddress: root.toAddress(network).toString(),
    rootWif: root.toString(),
    network,
  };
};

// 加密密码
export const encryptPassword = (password: string): string => {
  if (!password) return "";
  const md5Password = MD5(password).toString();
  const sha256Str = SHA256(md5Password).toString();
  return sha256Str.toUpperCase();
};

// AES 加密
export const aesEncrypt = (str: string, key: string): string => {
  // 密码长度不足 16/32 位用 0 补够位数
  key = key.length > 16 ? key.padEnd(32, "0") : key.padEnd(16, "0");
  const iv = "0000000000000000";
  const utf8Str = Utf8.parse(str);
  const utf8Key = Utf8.parse(key);
  const utf8Iv = Utf8.parse(iv);
  const cipherText = AES.encrypt(utf8Str, utf8Key, {
    iv: utf8Iv,
    mode: CBC,
    padding: Pkcs7,
  });
  const bufferData = Buffer.from(cipherText.toString(), "base64");
  const res = bufferData.toString("hex");
  return res;
};

// 加密助记词
export const encryptMnemonic = (mnemonic: string, password: string): string => {
  const mnemonicStr = mnemonic.split(" ").join(",");
  return aesEncrypt(mnemonicStr, password);
};

export function eciesDecryptData(
  data: Buffer | string,
  privateKey: mvc.PrivateKey | string,
  publicKey?: string
): string {
  publicKey = publicKey || data.toString().substring(8, 74);
  //const ECIES = new mvc.ECIES();
  let ecies = ECIES().privateKey(privateKey).publicKey(publicKey);
  if (!Buffer.isBuffer(data)) {
    data = Buffer.from(data, "hex");
  }
  let res = "";
  try {
    res = ecies.decrypt(data).toString();
  } catch (error) {
    try {
      //const ECIES = new mvc.ECIES({ noKey: true });
      ecies = ECIES({ noKey: true })
        .privateKey(privateKey)
        .publicKey(publicKey);
      res = ecies.decrypt(data).toString();
    } catch (error) {
      throw new Error("error");
    }
  }
  return res;
}

export const signature = (message: string, privateKey: string) => {
  const hash = mvc.crypto.Hash.sha256(Buffer.from(message));
  const sign = mvc.crypto.ECDSA.sign(hash, new mvc.PrivateKey(privateKey));

  return sign.toBuffer().toString("base64");
};

export const createMnemonic = (address: string) => {
  const ppBuffer = Buffer.from(address);
  const ppHex = mvc.crypto.Hash.sha256(ppBuffer).toString("hex");
  let hex;
  let mnemonic;
  hex = Buffer.from(ppHex.toLowerCase(), "hex").toString("hex");
  hex = Ripemd128(hex).toString();
  mnemonic = bip39.entropyToMnemonic(hex, englishWords);
  return mnemonic;
};

export async function compressImage(image: File): Promise<File> {
  return new Promise((resolve, reject) => {
    new Compressor(image, {
      quality: 0.6,
      convertSize: 100_000, // 100KB
      success: resolve as () => File,
      error: reject,
    });
  });
}

// 降文件转为 AttachmentItem， 便于操作/上链
export function FileToAttachmentItem(
  file: File,
  encrypt: IsEncrypt = IsEncrypt.No
) {
  return new Promise<AttachmentItem>(async (resolve, reject) => {
    function readResult(blob: Blob) {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // @ts-ignore
          const wordArray = CryptoJs.lib.WordArray.create(reader.result);
          // @ts-ignore
          const buffer = Buffer.from(reader.result);
          hex += buffer.toString("hex"); // 更新hex
          // 增量更新计算结果
          sha256Algo.update(wordArray); // 更新hash
          resolve();
        };
        reader.readAsArrayBuffer(blob);
      });
    }
    // 分块读取，防止内存溢出，这里设置为20MB,可以根据实际情况进行配置
    const chunkSize = 20 * 1024 * 1024;

    let hex = ""; // 二进制
    const sha256Algo = CryptoJs.algo.SHA256.create();

    for (let index = 0; index < file.size; index += chunkSize) {
      await readResult(file.slice(index, index + chunkSize));
    }
    resolve({
      data: hex,
      fileName: file.name,
      fileType: file.type,
      sha256: encHex.stringify(sha256Algo.finalize()),
      url: URL.createObjectURL(file),
      encrypt,
      size: file.size,
    });
  });
}
