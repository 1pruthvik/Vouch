import { expect } from "chai";
import { ethers } from "hardhat";

describe("MST Blockchain Chit Fund - Bidding Schema & Lifecycle Specification", function () {
  let deployer: any, member1: any, member2: any, member3: any, voucher1: any;
  let factory: any, vouchRegistry: any, yieldVault: any;

  const installmentAmount = ethers.parseEther("1.0"); // 1 tMSTC per member
  const memberCount = 3;
  const cycleDuration = 300;
  const discountCapBps = 3000; // 30% max discount (discount floor)
  const bitFeeBps = 500; // 5% BIT fee
  const safetyFactorBps = 10000;

  beforeEach(async function () {
    [deployer, member1, member2, member3, voucher1] = await ethers.getSigners();

    // 1. Deploy Mock Aave / Yield Vault
    const YieldVault = await ethers.getContractFactory("MockYieldVault");
    yieldVault = await YieldVault.deploy();
    await yieldVault.waitForDeployment();
    await yieldVault.fundYieldReserves({ value: ethers.parseEther("5.0") });

    // 2. Deploy VouchRegistry
    const VouchRegistry = await ethers.getContractFactory("VouchRegistry");
    vouchRegistry = await VouchRegistry.deploy();
    await vouchRegistry.waitForDeployment();

    // 3. Deploy Factory
    const ChitFactory = await ethers.getContractFactory("ChitFactory");
    factory = await ChitFactory.deploy(
      await vouchRegistry.getAddress(),
      await yieldVault.getAddress()
    );
    await factory.waitForDeployment();
    await vouchRegistry.authorizeGroup(await factory.getAddress(), true);
  });

  it("Executes the complete Chit Fund Bidding Schema (Day 1 Mandates -> Days 2-30 Aave Yield -> Day 31 Secret Bidding & BIT Fee -> Dividends)", async function () {
    // A. Deploy Circle
    const tx = await factory.createGroup(
      "MST Genesis Circle",
      memberCount,
      installmentAmount,
      cycleDuration,
      discountCapBps,
      bitFeeBps,
      safetyFactorBps
    );
    await tx.wait();
    const [groupAddr] = await factory.getDeployedGroups();
    const group = await ethers.getContractAt("ChitGroup", groupAddr);
    await vouchRegistry.authorizeGroup(groupAddr, true);

    // B. Members Join with Buffer
    await group.connect(member1).joinGroup({ value: installmentAmount });
    await group.connect(member2).joinGroup({ value: installmentAmount });
    await group.connect(member3).joinGroup({ value: installmentAmount });
    expect(await group.currentState()).to.equal(1); // Collect (Day 1)

    // C. Register & Execute BridgeKey Mandates (Day 1: Autopay Inflow)
    await group.connect(member1).registerBridgeKeyMandate(ethers.parseEther("2.0"));
    const mandate1 = await group.bridgeKeyMandates(member1.address);
    expect(mandate1.active).to.be.true;

    // Member 1 pays via Mandate
    await group.executeBridgeKeyMandate(member1.address, { value: installmentAmount });
    // Members 2 & 3 pay standard monthly installment
    await group.connect(member2).payInstallment({ value: installmentAmount });
    await group.connect(member3).payInstallment({ value: installmentAmount });

    // D. Days 2 - 30: Deployed to Aave De-Fi Yield & entered Commit state
    expect(await group.currentState()).to.equal(2); // Commit
    expect(await group.activeYieldShares()).to.equal(ethers.parseEther("3.0"));

    // E. Day 31: Secret Commit-Reveal Bidding
    // Total pot = 3.0 tMSTC.
    // Member 1 secret bid: 2.7 tMSTC (asks for 2.7, leaves 0.3 discount)
    // Member 2 secret bid: 2.5 tMSTC (asks for 2.5, leaves 0.5 discount) - Lowest bidder / Winner!
    // Member 3 secret bid: 2.8 tMSTC (asks for 2.8, leaves 0.2 discount)
    const salt1 = ethers.encodeBytes32String("salt_member1_secret");
    const salt2 = ethers.encodeBytes32String("salt_member2_secret");
    const salt3 = ethers.encodeBytes32String("salt_member3_secret");

    const bid1 = ethers.parseEther("2.7");
    const bid2 = ethers.parseEther("2.5");
    const bid3 = ethers.parseEther("2.8");

    const hash1 = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "address"],
      [bid1, salt1, member1.address]
    );
    const hash2 = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "address"],
      [bid2, salt2, member2.address]
    );
    const hash3 = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "address"],
      [bid3, salt3, member3.address]
    );

    // Commit secret sealed bids
    await group.connect(member1).commitBid(hash1);
    await group.connect(member2).commitBid(hash2);
    await group.connect(member3).commitBid(hash3);

    // Advance to Reveal phase
    await group.advanceToReveal();
    expect(await group.currentState()).to.equal(3); // Reveal

    // Reveal bids
    await group.connect(member1).revealBid(bid1, salt1);
    await group.connect(member2).revealBid(bid2, salt2);
    await group.connect(member3).revealBid(bid3, salt3);

    expect(await group.lowestBidder()).to.equal(member2.address);
    expect(await group.lowestBidAmount()).to.equal(bid2);

    // F. Settlement, BIT Fee Cut & Dividend Distribution
    const initialBal2 = await ethers.provider.getBalance(member2.address);
    await group.settleRound();

    // Verification:
    // Total pot = 3.0 tMSTC.
    // Winning bid = 2.5 tMSTC (Member 2).
    // Discount = 3.0 - 2.5 = 0.5 tMSTC.
    // BIT fee (5% of 0.5 discount) = 0.025 tMSTC (pooled in reserveFundBalance).
    // Remaining dividend pool = (0.5 - 0.025) + Aave yield.
    // Dividend per member >= 0.475 / 3 = 0.1583 tMSTC.
    const reserveBal = await group.reserveFundBalance();
    expect(reserveBal).to.equal(ethers.parseEther("0.025"));

    const member1Details = await group.getMemberDetails(member1.address);
    expect(member1Details.lockedDividends).to.be.gt(0);

    const member2Details = await group.getMemberDetails(member2.address);
    expect(member2Details.hasWon).to.be.true;
    expect(member2Details.winRound).to.equal(1);
  });
});
