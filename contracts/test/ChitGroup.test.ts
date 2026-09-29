import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vouch Protocol - Full Smart Contract Test Suite", function () {
  let deployer: any, member1: any, member2: any, member3: any, voucher1: any, nonMember: any;
  let factory: any, vouchRegistry: any, yieldVault: any, mockERC20: any;

  const installmentAmount = ethers.parseEther("0.1");
  const memberCount = 3;
  const cycleDuration = 300; // 5 mins
  const discountCapBps = 3000; // 30% max discount (discount floor)
  const reserveFeeBps = 500; // 5%
  const safetyFactorBps = 10000; // 100%

  beforeEach(async function () {
    [deployer, member1, member2, member3, voucher1, nonMember] = await ethers.getSigners();

    // 1. Deploy MockYieldVault
    const YieldVault = await ethers.getContractFactory("MockYieldVault");
    yieldVault = await YieldVault.deploy();
    await yieldVault.waitForDeployment();
    // Fund yield vault with extra reserves for simulated yield payouts
    await yieldVault.fundYieldReserves({ value: ethers.parseEther("1.0") });

    // 2. Deploy VouchRegistry
    const VouchRegistry = await ethers.getContractFactory("VouchRegistry");
    vouchRegistry = await VouchRegistry.deploy();
    await vouchRegistry.waitForDeployment();

    // 3. Deploy ChitFactory
    const ChitFactory = await ethers.getContractFactory("ChitFactory");
    factory = await ChitFactory.deploy(
      await vouchRegistry.getAddress(),
      await yieldVault.getAddress()
    );
    await factory.waitForDeployment();

    // Authorize factory in VouchRegistry
    await vouchRegistry.authorizeGroup(await factory.getAddress(), true);
  });

  describe("1. ChitFactory & Group Initialization", function () {
    it("Should deploy ChitGroup and set immutable parameters correctly", async function () {
      const tx = await factory.createGroup(
        "Alpha Circle",
        memberCount,
        installmentAmount,
        cycleDuration,
        discountCapBps,
        reserveFeeBps,
        safetyFactorBps
      );
      await tx.wait();

      const groups = await factory.getDeployedGroups();
      expect(groups.length).to.equal(1);

      const group = await ethers.getContractAt("ChitGroup", groups[0]);
      expect(await group.groupName()).to.equal("Alpha Circle");
      expect(await group.memberCount()).to.equal(memberCount);
      expect(await group.installmentAmount()).to.equal(installmentAmount);
      expect(await group.discountCapBps()).to.equal(discountCapBps);
      expect(await group.currentState()).to.equal(0); // Forming
    });
  });

  describe("2. Member Joining & State Transitions", function () {
    let group: any;

    beforeEach(async function () {
      const tx = await factory.createGroup(
        "Alpha Circle",
        memberCount,
        installmentAmount,
        cycleDuration,
        discountCapBps,
        reserveFeeBps,
        safetyFactorBps
      );
      await tx.wait();
      const [groupAddr] = await factory.getDeployedGroups();
      group = await ethers.getContractAt("ChitGroup", groupAddr);
      await vouchRegistry.authorizeGroup(groupAddr, true);
    });

    it("Should require at least 1 installment as buffer deposit to join", async function () {
      await expect(
        group.connect(member1).joinGroup({ value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Buffer deposit must be at least 1 installment");
    });

    it("Should transition from Forming to Collect (Round 1) when member count is reached", async function () {
      await group.connect(member1).joinGroup({ value: installmentAmount });
      expect(await group.currentState()).to.equal(0); // Still Forming

      await group.connect(member2).joinGroup({ value: installmentAmount });
      expect(await group.currentState()).to.equal(0); // Still Forming

      await group.connect(member3).joinGroup({ value: installmentAmount });
      expect(await group.currentState()).to.equal(1); // Collect
      expect(await group.currentRound()).to.equal(1);
    });
  });

  describe("3. Full Round Cycle: Collections, Reverse Auction & Settlement", function () {
    let group: any;

    beforeEach(async function () {
      const tx = await factory.createGroup(
        "Alpha Circle",
        memberCount,
        installmentAmount,
        cycleDuration,
        discountCapBps,
        reserveFeeBps,
        safetyFactorBps
      );
      await tx.wait();
      const [groupAddr] = await factory.getDeployedGroups();
      group = await ethers.getContractAt("ChitGroup", groupAddr);
      await vouchRegistry.authorizeGroup(groupAddr, true);

      // 3 members join with 0.1 ETH buffer
      await group.connect(member1).joinGroup({ value: installmentAmount });
      await group.connect(member2).joinGroup({ value: installmentAmount });
      await group.connect(member3).joinGroup({ value: installmentAmount });
    });

    it("Should complete a full reverse auction round with commit-reveal and dividend distribution", async function () {
      // 1. All 3 members pay installment for Round 1
      await group.connect(member1).payInstallment({ value: installmentAmount });
      await group.connect(member2).payInstallment({ value: installmentAmount });
      // When 3rd member pays, it automatically advances to Commit
      await group.connect(member3).payInstallment({ value: installmentAmount });

      expect(await group.currentState()).to.equal(2); // Commit

      // 2. Commit Bids
      // Pot = 3 * 0.1 = 0.3 ETH. Min Bid (30% discount floor) = 0.21 ETH.
      const bid1 = ethers.parseEther("0.24"); // Member 1 bids 0.24 ETH
      const salt1 = ethers.encodeBytes32String("salt1");
      const hash1 = ethers.solidityPackedKeccak256(
        ["uint256", "bytes32", "address"],
        [bid1, salt1, member1.address]
      );

      const bid2 = ethers.parseEther("0.22"); // Member 2 bids 0.22 ETH (Lower = more discount = winning)
      const salt2 = ethers.encodeBytes32String("salt2");
      const hash2 = ethers.solidityPackedKeccak256(
        ["uint256", "bytes32", "address"],
        [bid2, salt2, member2.address]
      );

      await group.connect(member1).commitBid(hash1);
      await group.connect(member2).commitBid(hash2);

      // Advance to Reveal
      await group.advanceToReveal();
      expect(await group.currentState()).to.equal(3); // Reveal

      // 3. Reveal Bids
      await group.connect(member1).revealBid(bid1, salt1);
      await group.connect(member2).revealBid(bid2, salt2);

      expect(await group.lowestBidder()).to.equal(member2.address);
      expect(await group.lowestBidAmount()).to.equal(bid2);

      // 4. Settle Round
      const winnerBalanceBefore = await ethers.provider.getBalance(member2.address);
      const settleTx = await group.settleRound();
      await settleTx.wait();

      // Check member 2 won
      const member2Details = await group.getMemberDetails(member2.address);
      expect(member2Details.hasWon).to.be.true;
      expect(member2Details.winRound).to.equal(1);

      // Next round started
      expect(await group.currentState()).to.equal(1); // Collect
      expect(await group.currentRound()).to.equal(2);

      // Check locked dividends distributed to members
      const member1Details = await group.getMemberDetails(member1.address);
      expect(member1Details.lockedDividends).to.be.gt(0);
      expect(await group.reserveFundBalance()).to.be.gt(0);
    });

    it("Should reject bids below the discount floor", async function () {
      await group.connect(member1).payInstallment({ value: installmentAmount });
      await group.connect(member2).payInstallment({ value: installmentAmount });
      await group.connect(member3).payInstallment({ value: installmentAmount });

      // Pot = 0.3 ETH. Min Bid at 30% cap is 0.21 ETH.
      const illegalBid = ethers.parseEther("0.15"); // 50% discount -> illegal
      const salt = ethers.encodeBytes32String("salt");
      const hash = ethers.solidityPackedKeccak256(
        ["uint256", "bytes32", "address"],
        [illegalBid, salt, member1.address]
      );

      await group.connect(member1).commitBid(hash);
      await group.advanceToReveal();

      await expect(
        group.connect(member1).revealBid(illegalBid, salt)
      ).to.be.revertedWith("Bid violates maximum discount floor");
    });
  });

  describe("4. 5-Step Waterfall Default Handling & Staked Vouching", function () {
    let group: any;

    beforeEach(async function () {
      const tx = await factory.createGroup(
        "Alpha Circle",
        memberCount,
        installmentAmount,
        cycleDuration,
        discountCapBps,
        reserveFeeBps,
        safetyFactorBps
      );
      await tx.wait();
      const [groupAddr] = await factory.getDeployedGroups();
      group = await ethers.getContractAt("ChitGroup", groupAddr);
      await vouchRegistry.authorizeGroup(groupAddr, true);

      // Members join
      await group.connect(member1).joinGroup({ value: installmentAmount });
      await group.connect(member2).joinGroup({ value: installmentAmount });
      await group.connect(member3).joinGroup({ value: installmentAmount });

      // Voucher deposits stake and vouches for member 3
      await vouchRegistry.connect(voucher1).depositStake({ value: ethers.parseEther("0.5") });
      await vouchRegistry.connect(voucher1).registerVouch(
        member3.address,
        groupAddr,
        ethers.parseEther("0.2")
      );
    });

    it("Should execute Layer 1 (buffer) absorption when member defaults", async function () {
      // Member 1 and Member 2 pay
      await group.connect(member1).payInstallment({ value: installmentAmount });
      await group.connect(member2).payInstallment({ value: installmentAmount });

      // Member 3 fails to pay -> handle default
      const defaultTx = await group.handleMemberDefault(member3.address);
      const receipt = await defaultTx.wait();

      // Buffer balance of Member 3 should now be 0 (used 0.1 ETH buffer)
      const member3Details = await group.getMemberDetails(member3.address);
      expect(member3Details.bufferBalance).to.equal(0);
      expect(member3Details.isDefaulted).to.be.true;

      // Group successfully moved to Commit
      expect(await group.currentState()).to.equal(2); // Commit
    });

    it("Should slash voucher stake (Layer 3) if buffer is exhausted", async function () {
      // Drain Member 3's buffer first in Round 1
      await group.connect(member1).payInstallment({ value: installmentAmount });
      await group.connect(member2).payInstallment({ value: installmentAmount });
      await group.handleMemberDefault(member3.address); // Drains buffer to 0

      // Advance and settle Round 1
      await group.advanceToReveal();
      await group.settleRound();

      expect(await group.currentRound()).to.equal(2);

      // In Round 2, Member 3 defaults again with 0 buffer and small dividends
      await group.connect(member1).payInstallment({ value: installmentAmount });
      await group.connect(member2).payInstallment({ value: installmentAmount });

      const voucherFreeStakeBefore = await vouchRegistry.getFreeStake(voucher1.address);
      await group.handleMemberDefault(member3.address);

      // Voucher stake was slashed to cover the deficit
      const voucherDetails = await vouchRegistry.vouchers(voucher1.address);
      expect(voucherDetails.lockedStake).to.be.lt(ethers.parseEther("0.2"));
      expect(voucherDetails.reputationScore).to.equal(800); // 1000 - 200 penalty
    });
  });

  describe("5. Full Multi-Round Lifecycle & Final Withdrawal", function () {
    it("Should complete all 3 rounds and allow final balances withdrawal in Closed state", async function () {
      const tx = await factory.createGroup(
        "Complete 3-Round Circle",
        memberCount,
        installmentAmount,
        cycleDuration,
        discountCapBps,
        reserveFeeBps,
        safetyFactorBps
      );
      await tx.wait();
      const [groupAddr] = await factory.getDeployedGroups();
      const group = await ethers.getContractAt("ChitGroup", groupAddr);
      await vouchRegistry.authorizeGroup(groupAddr, true);

      // Join
      await group.connect(member1).joinGroup({ value: installmentAmount });
      await group.connect(member2).joinGroup({ value: installmentAmount });
      await group.connect(member3).joinGroup({ value: installmentAmount });

      // Round 1
      await group.connect(member1).payInstallment({ value: installmentAmount });
      await group.connect(member2).payInstallment({ value: installmentAmount });
      await group.connect(member3).payInstallment({ value: installmentAmount });
      await group.advanceToReveal();
      await group.settleRound();

      // Round 2
      await group.connect(member1).payInstallment({ value: installmentAmount });
      await group.connect(member2).payInstallment({ value: installmentAmount });
      await group.connect(member3).payInstallment({ value: installmentAmount });
      await group.advanceToReveal();
      await group.settleRound();

      // Round 3 (Final Round)
      await group.connect(member1).payInstallment({ value: installmentAmount });
      await group.connect(member2).payInstallment({ value: installmentAmount });
      await group.connect(member3).payInstallment({ value: installmentAmount });
      await group.advanceToReveal();
      await group.settleRound();

      // Should now be Closed
      expect(await group.currentState()).to.equal(5); // Closed

      // Non-defaulted members withdraw remaining buffers + dividends
      await group.connect(member1).withdrawFinalBalances();
      const member1Details = await group.getMemberDetails(member1.address);
      expect(member1Details.bufferBalance).to.equal(0);
      expect(member1Details.lockedDividends).to.equal(0);
    });
  });
});
