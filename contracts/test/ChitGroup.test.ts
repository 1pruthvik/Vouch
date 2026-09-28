import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vouch Protocol - ChitGroup & ChitFactory", function () {
  let deployer: any, member1: any, member2: any, member3: any, voucher: any;
  let factory: any, vouchRegistry: any, yieldVault: any;

  beforeEach(async function () {
    [deployer, member1, member2, member3, voucher] = await ethers.getSigners();

    const YieldVault = await ethers.getContractFactory("MockYieldVault");
    yieldVault = await YieldVault.deploy();

    const VouchRegistry = await ethers.getContractFactory("VouchRegistry");
    vouchRegistry = await VouchRegistry.deploy();

    const ChitFactory = await ethers.getContractFactory("ChitFactory");
    factory = await ChitFactory.deploy(await vouchRegistry.getAddress(), await yieldVault.getAddress());
  });

  it("Should create a new ChitGroup via ChitFactory", async function () {
    const installment = ethers.parseEther("0.1");
    const memberCount = 3;
    const cycleDuration = 3600;
    const discountCapBps = 3000; // 30%
    const reserveFeeBps = 500;   // 5%
    const safetyFactorBps = 10000; // 100%

    const tx = await factory.createGroup(
      "Test Group 1",
      memberCount,
      installment,
      cycleDuration,
      discountCapBps,
      reserveFeeBps,
      safetyFactorBps
    );
    await tx.wait();

    const deployedGroups = await factory.getDeployedGroups();
    expect(deployedGroups.length).to.equal(1);
  });

  it("Should allow members to join and advance to Collect state", async function () {
    const installment = ethers.parseEther("0.1");
    const memberCount = 2;

    const tx = await factory.createGroup(
      "Fast 2-Member Group",
      memberCount,
      installment,
      60,
      3000,
      500,
      10000
    );
    await tx.wait();

    const [groupAddress] = await factory.getDeployedGroups();
    const group = await ethers.getContractAt("ChitGroup", groupAddress);

    // Member 1 joins with buffer
    await group.connect(member1).joinGroup({ value: installment });
    expect(await group.isMember(member1.address)).to.be.true;
    expect(await group.currentState()).to.equal(0); // Forming

    // Member 2 joins with buffer -> triggers transition to Collect (State 1)
    await group.connect(member2).joinGroup({ value: installment });
    expect(await group.currentState()).to.equal(1); // Collect
    expect(await group.currentRound()).to.equal(1);
  });
});
