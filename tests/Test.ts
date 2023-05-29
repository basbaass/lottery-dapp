describe("deployment", function () {
  it("Should Implement ownable", async () => {
    throw new Error("Not implemented");
  });
  it("Should Only Allow The Owner To deploy lottery and define betting price and fee", async () => {
    throw new Error("Not implemented");
  });
  it("Should Require That Only Owner start lottery", async () => {
    it("Should require a block timestamp target", async () => {
      throw new Error("Not implemented");
    });
  });
});

describe("Outside Of Betting Window", function () {
  it("Players must buy an ERC20 with ETH", async () => {
    throw new Error("Not implemented");
  });
  it("Players pay ERC20 to bet", async () => {
    it("Only possible before block timestamp met", async () => {
      throw new Error("Not implemented");
    });
  });
  it("Anyone can roll the lottery", async () => {
    it("Only after block timestamp target is met", async () => {});
    it("Randomness from RANDAO", async () => {});
  });
});
describe("During Betting Window", function () {});
describe("After Completion of Lottery", function () {
  it("Winner receives the pooled ERC20 minus fee", async () => {
    throw new Error("Not implemented");
  });
  it("Owner can withdraw fees and restart lottery", async () => {
    throw new Error("Not implemented");
  });
  it("Players can burn ERC20 tokens and redeem ETH", async () => {
    throw new Error("Not implemented");
  });
});
