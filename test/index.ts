import expect from "expect.js";

import Transation from "./transation";
describe("单元测试", function () {
  describe("功能1", function () {
    it("相等", function () {
      const tx = new Transation();
      const res = tx.build_tx_data({
        payTos: [
          {
            address: "123",
            amount: 1000,
          },
        ],
      });
      expect(res.payTos[0].amount).to.equal(1000);
    });
  });
});
