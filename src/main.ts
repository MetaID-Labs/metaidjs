import Transation from "@/transation/transation";

const tx = new Transation();
tx.build_tx_data({
  payTos: [
    {
      amount: 1000,
      address: "12313",
    },
  ],
  opData: "",
});
