import { SDK } from "@/utils/sdk";

class Transation {
  sdk: SDK;
  constructor(Sdk: SDK) {
    this.sdk = Sdk;
  }

  public build_tx_data(params: BuildTxDataPramas) {
    console.log(params);
  }

  public async build_meta_data(params: BuildMetaDataPramas) {
    console.log(params);
    const buzz = await this.sdk
      .createBrfcChildNode({
        nodeName: params.metaData.nodeName,
        data: JSON.stringify({
          content: `Test metaidjs in testnet ${+Date.now()} 8888`,
          contentType: "text/plain",
          quoteTx: params.txId,
          attachments: params.attachments,
          mention: [],
        }),
      })
      .catch((error) => {
        console.log(error);
      });
    console.log("buzz", buzz);
    return buzz;
  }
}

export default Transation;
