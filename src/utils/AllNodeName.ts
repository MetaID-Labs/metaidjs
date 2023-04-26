import { NodeName } from "@/enum";

const AllNodeName: {
  [key in NodeName]: {
    brfcId: string;
    path: string;
    version: string;
  };
} = {
  // NOT  Protocols Node
  [NodeName.LegalSellNft]: {
    brfcId: "--",
    path: "--",
    version: "1.0.0",
  },

  // Info Node
  [NodeName.ETHBinding]: {
    brfcId: "--",
    path: "info",
    version: "1.0.0",
  },
  [NodeName.Name]: {
    brfcId: "--",
    path: "info",
    version: "1.0.0",
  },
  [NodeName.Phone]: {
    brfcId: "--",
    path: "info",
    version: "1.0.0",
  },
  [NodeName.Email]: {
    brfcId: "--",
    path: "info",
    version: "1.0.0",
  },

  // Protocols Node
  [NodeName.SimpleMicroblog]: {
    brfcId: "b17e9e277bd7",
    path: "/Protocols/SimpleMicroblog",
    version: "1.0.0",
  },
  [NodeName.MetaFile]: {
    brfcId: "fcac10a5ed83",
    path: "/Protocols/MetaFile",
    version: "1.0.1",
  },
  [NodeName.SimpleGroupChat]: {
    brfcId: "96e2649ce8b6",
    path: "/Protocols/SimpleGroupChat",
    version: "1.0.2",
  },
  [NodeName.SimpleFileGroupChat]: {
    brfcId: "47cf94e87a8a",
    path: "/Protocols/SimpleFileGroupChat",
    version: "1.0.0",
  },

  [NodeName.NFTAvatar]: {
    brfcId: "b1e12b089e71",
    path: "/Protocols/NFTAvatar",
    version: "1.0.0",
  },
  [NodeName.PayComment]: {
    brfcId: "9396c994040a",
    path: "/Protocols/PayComment",
    version: "1.0.0",
  },
  [NodeName.SimpleRePost]: {
    brfcId: "157cd804478e",
    path: "/Protocols/SimpleRePost",
    version: "1.0.0",
  },
  [NodeName.PayLike]: {
    brfcId: "2ae43eeb26d9",
    path: "/Protocols/PayLike",
    version: "1.0.0",
  },
  [NodeName.SimpleCommunity]: {
    brfcId: "c12f783a883f",
    path: "/Protocols/SimpleCommunity",
    version: "1.0.3",
  },
  [NodeName.SimpleCommunityJoin]: {
    brfcId: "b736fc6b98fd",
    path: "/Protocols/SimpleCommunityJoin",
    version: "1.0.0",
  },
  [NodeName.ShowMsg]: {
    brfcId: "1bf2c5a70377",
    path: "/Protocols/ShowMsg",
    version: "1.0.1",
  },
  [NodeName.SimpleGroupCreate]: {
    brfcId: "7b2b19ddf267",
    path: "/Protocols/SimpleGroupCreate",
    version: "1.0.3",
  },
  [NodeName.PayFollow]: {
    brfcId: "203ee2c8b732",
    path: "/Protocols/PayFollow",
    version: "1.0.0",
  },
  [NodeName.NftIssue]: {
    brfcId: "5a6fa04c6612",
    path: "/Protocols/NftIssue",
    version: "1.0.0",
  },
  [NodeName.NftGenesis]: {
    brfcId: "599aa8e586e8",
    path: "/Protocols/NftGenesis",
    version: "1.0.0",
  },
  [NodeName.FtIssue]: {
    brfcId: "97b23b9f3a09",
    path: "/Protocols/FtIssue",
    version: "1.0.0",
  },
  [NodeName.FtGenesis]: {
    brfcId: "c75e9217b9bd",
    path: "/Protocols/FtGenesis",
    version: "1.0.0",
  },
  [NodeName.SimpleRedEnvelope]: {
    brfcId: "695e19ddf852",
    path: "/Protocols/SimpleRedEnvelope",
    version: "1.0.2",
  },
  [NodeName.SimplePublicShare]: {
    brfcId: "ba9478837e9a",
    path: "/Protocols/SimplePublicShare",
    version: "1.0.0",
  },
  [NodeName.OpenRedenvelope]: {
    brfcId: "bf90aa3b2d1c",
    path: "/Protocols/OpenRedenvelope",
    version: "1.0.1",
  },
  [NodeName.MetaNote]: {
    brfcId: "4934f562fc29",
    path: "/Protocols/metanote",
    version: "1.0.1",
  },
  [NodeName.NftSell]: {
    brfcId: "13104a689fd3",
    path: "/Protocols/NftSell",
    version: "1.0.1",
  },
  [NodeName.SimpleFileMsg]: {
    brfcId: "1b9ff346f190",
    path: "/Protocols/SimpleFileMsg",
    version: "1.0.1",
  },
  [NodeName.SimpleCreateAnnouncement]: {
    brfcId: "97b6023a62e8",
    path: "/Protocols/SimpleCreateAnnouncement",
    version: "1.0.4",
  },
  [NodeName.SimpleAnnouncementQuote]: {
    brfcId: "4118a343ce29",
    path: "/Protocols/SimpleAnnouncementQuote",
    version: "1.0.5",
  },
  [NodeName.SimpleDAOCreate]: {
    brfcId: "c35433ced842",
    path: "/Protocols/SimpleDAOCreate",
    version: "1.0.5",
  },
  [NodeName.NftName]: {
    brfcId: "6ed1b1d1119d",
    path: "/Protocols/NftName",
    version: "1.0.0",
  },
  [NodeName.NftTransfer]: {
    brfcId: "e13d25db6c9c",
    path: "/Protocols/NftTransfer",
    version: "1.0.2",
  },
  [NodeName.SendMoney]: {
    brfcId: "xxxxxxxxxxxx",
    path: "/Protocols/SendMoney",
    version: "1.0.0",
  },
  [NodeName.NftCancel]: {
    brfcId: "249044dac325",
    path: "/Protocols/NftCancel",
    version: "1.0.3",
  },
  [NodeName.nftBuy]: {
    brfcId: "1847e7d33857",
    path: "/Protocols/nftBuy",
    version: "1.0.2",
  },
  [NodeName.ShareChatMessage]: {
    brfcId: "11111111111",
    path: "/Protocols/ShareChatMessage",
    version: "1.0.0",
  },
};

export default AllNodeName;
