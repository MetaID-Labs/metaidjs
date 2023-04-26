import Transation from "@/transation/transation";
import { hdWalletFromMnemonic } from "@/utils/index";
import HdWallet from "@/utils/wallet/hd-wallet";
import { Network, NodeName } from "@/enum";
import { SDK } from "@/utils/sdk";
import Env from "./config/config";
const mnemonic = `market pole juice jazz soda before slow never youth mutual figure climb`;

async function test() {
  console.log("123", __env__);
  // const metaidwallet = window.metaidwallet;
  // console.log("connect", metaidwallet);
  // try {
  //   const balance = await metaidwallet.getBalance().catch((e) => {
  //     console.log("connect", e);
  //   });
  //   console.log("connect", balance);
  // } catch (error) {
  //   console.log("connect", error);
  // }
}

// test();

const init = async () => {
  try {
    const wallet = await hdWalletFromMnemonic(
      mnemonic,
      "new",
      Env.WalletNetWork,
      Env.WalletPath
    );
    const hdWallet = new HdWallet(wallet);
    const metaIdInfo = await hdWallet.getMetaIdInfo(hdWallet.rootAddress);

    const sdk = new SDK(Env.WalletNetWork);

    await sdk.initWallet(hdWallet);
    console.log("sdk", sdk);
    const userInfo = {
      ...metaIdInfo,
      metaId: metaIdInfo.metaId,
      name: metaIdInfo.name,
      address: hdWallet.rootAddress,
      showWallet: sdk,
      loginType: "MetaID",
    };
    window.localStorage.setItem("userInfo", JSON.stringify(userInfo));
    console.log(
      "userInfo",
      JSON.parse(window.localStorage.getItem("userInfo")!)
    );
    const Tx = new Transation(sdk);
    const result = await Tx.build_meta_data({
      metaData: {
        nodeName: NodeName.SimpleMicroblog,
      },
      payTos: [],
      attachments: [],
      needConfirm: false,
      publicKey: userInfo.pubKey!,
      opData: "",
      txId: "",
    });
    console.log("result", result);

    if (!metaIdInfo.metaId) {
      throw new Error(`metaid not exist`);
    }
    console.log("metaIdInfo", metaIdInfo);
  } catch (error) {}
};

// init();

// const tx = new Transation();
// tx.build_tx_data({
//   payTos: [
//     {
//       amount: 1000,
//       address: "12313",
//     },
//   ],
//   opData: "",
// });
