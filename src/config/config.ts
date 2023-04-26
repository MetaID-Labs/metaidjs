import { Network } from "@/enum";

const ProdConfig = {
  Aggregation: `https://api.show3.io/aggregation`,
  Dashbroad: `https://api.show3.io/tool/api`,
  BASEAPI: `https://api.show3.io`,
  WalletPath: 10001,
  WalletNetWork: Network.mainnet,
};

const TestConfig = {
  Aggregation: `https://api.show3.io/aggregation`,
  Dashbroad: `https://api-test.microvisionchain.com/tool/api`,
  BASEAPI: `https://testmvc.showmoney.app`,
  WalletPath: 236,
  WalletNetWork: Network.testnet,
};

const Env = __env__ === "testnet" ? TestConfig : ProdConfig;

export default Env;
