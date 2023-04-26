// @ts-ignore
import mvc from "mvc-lib";
import HdWallet from "@/utils/wallet/hd-wallet";
interface AddressPathItem {
  address: string;
  path: number;
}

interface TxChainInfoItem {
  txId: string;
  chain: string;
}

interface UnUsedUtxoItem extends UtxoItem {
  metaId: string;
}
export class Session {
  addressSessionKey = "AddressPath";
  txChainInfoSessionKeys = "txChainInfo";
  unUsedUtxosKey = "unUsedUtxosKey";
  wallet: HdWallet;
  addressPaths: AddressPathItem[] = window.sessionStorage.getItem(
    this.addressSessionKey
  )
    ? JSON.parse(window.sessionStorage.getItem(this.addressSessionKey)!)
    : [];

  // 存储txId所在链， 避免重复调接口查询
  txChainInfos: TxChainInfoItem[] = window.sessionStorage.getItem(
    this.txChainInfoSessionKeys
  )
    ? JSON.parse(window.sessionStorage.getItem(this.txChainInfoSessionKeys)!)
    : [];

  unUsedUtxos: UnUsedUtxoItem[] = window.sessionStorage.getItem(
    this.unUsedUtxosKey
  )
    ? JSON.parse(window.sessionStorage.getItem(this.unUsedUtxosKey)!)
    : [];

  constructor(wallet: mvc.HDPrivateKey) {
    this.wallet = wallet;
  }

  getAddressPath(address: string) {
    // const userStore = JSON.parse(window.localStorage.getItem("userInfo")!);
    let item = this.addressPaths.find((item) => item.address === address);
    if (item) {
      return item;
    } else {
      for (let i = 0; i <= 10000; i++) {
        const _address = this.wallet!.deriveChild(`m/0/${i}`)
          .privateKey.toAddress()
          .toString();
        if (_address === address) {
          console.log("path", i);
          item = {
            address: address,
            path: i,
          };
          this.addressPaths.push(item);
          window.sessionStorage.setItem(
            this.addressSessionKey,
            JSON.stringify(this.addressPaths)
          );
          break;
        }
      }
      if (item) {
        return item;
      } else {
        // @ts-ignore
        throw new Error(`PathMoreThan10000`);
      }
    }
  }

  addTxChainInfo(item: TxChainInfoItem) {
    this.txChainInfos.push(item);
    sessionStorage.setItem(
      this.txChainInfoSessionKeys,
      JSON.stringify(this.txChainInfos)
    );
  }

  addUnUsedUtxos(utxo: UnUsedUtxoItem) {
    this.unUsedUtxos.push(utxo);
    sessionStorage.setItem(
      this.unUsedUtxosKey,
      JSON.stringify(this.unUsedUtxosKey)
    );
  }
}
