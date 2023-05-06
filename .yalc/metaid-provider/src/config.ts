import { Network } from "./emums";

export const ShowMoneyBaseUrlMirror = {
  [Network.Testnet]: "https://testmvc.showmoney.app",
  [Network.Mainnet]: "https://api.show3.io",
};

export const MetaSvBaseUrlMirror = {
  [Network.Testnet]: "https://testmvc.showmoney.app/metasv",
  [Network.Mainnet]: "https://api.show3.io/metasv",
};
