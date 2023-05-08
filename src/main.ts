import { Network, NodeName } from "./enum/index";
import { MetaIDSdk } from "./utils/metaid-sdk";
import { compressImage, FileToAttachmentItem } from "./utils";

//这里需要传入要上传的文件对象
async function handleUploadImage(e: any) {
  const files: File[] = [...e.target.files];
  const attachments = [];
  for (let i = 0; i < files.length; i++) {
    if (attachments.length < 9) {
      // 压缩图片
      const compressed = await compressImage(files[i]);
      const result = await FileToAttachmentItem(compressed);
      if (result) attachments.push(result);
    } else {
      break;
    }
  }
  return attachments;
}

export async function init() {
  try {
    const metaidjsSDK = new MetaIDSdk({
      network: Network.testnet,
      providerApi: {
        base: {
          network: Network.testnet,
          showMoneyBaseUrl: `https://testmvc.showmoney.app`,
          metaSvBaseUrl: `https://testmvc.showmoney.app/metasv`,
        },
      },
    });

    await metaidjsSDK.initWallet();
    await metaidjsSDK.initMetaIdNode();

    const attachments = [
      "metafile://c6c5d695d86c8338fe71a63f8f198d045baad7ce79a33046646b0a40ddbd37e6.jpg",
    ]; //这里是图片上链后的交易TX，如果是本地未上链图片需要调用 handleUploadImage先把图片处理成hex，实际就是把调用的结果赋值给attachments即可
    const buzz = await metaidjsSDK.build_meta_data({
      metaData: {
        nodeName: NodeName.SimpleMicroblog,
        data: JSON.stringify({
          //发帖
          content: `Test metaidjs in testnet ${+Date.now()} new image`, //Test metaidjs in testnet ${+Date.now()} new
          contentType: "text/plain",
          quoteTx: ``,
          attachments: metaidjsSDK.getAttachmentsMark(attachments),
          mention: [],
          //转发
          // createTime: new Date().getTime(),
          // rePostTx: `5b97d86eaa372ade530b1e47b9122d131a1b1322cb779fd981531986f81444ba`,
          // rePostProtocol: NodeName.SimpleMicroblog,
          // rePostComment: "",
          //点赞
          // createTime: new Date().getTime(),
          // isLike: "1",
          // likeTo: `5b97d86eaa372ade530b1e47b9122d131a1b1322cb779fd981531986f81444ba`,
          // pay: 2000,
          // payTo: `n11W7vY8JnmXpx73Sr4wimP2fHwKQg61A7`,
        }),
      },
      payTos: [
        // {
        //   amount: 2000,
        //   address: `n11W7vY8JnmXpx73Sr4wimP2fHwKQg61A7`,
        // },
      ],
      attachments:
        attachments.length && typeof attachments[0] === "string"
          ? []
          : attachments,
      needConfirm: false,
      publicKey: "",
      opData: "",
      txId: "",
    });
    console.log("buzz", buzz);
    // if (!metaIdInfo.metaId) {
    //   throw new Error(`metaid not exist`);
    // }
    // console.log("metaIdInfo", metaIdInfo);
  } catch (error) {
    console.log("error", error);
  }
}
init();
