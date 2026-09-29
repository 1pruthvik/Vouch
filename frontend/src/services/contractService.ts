/**
 * ContractService — High-level abstraction layer backed by Vouch Blockchain SDK (Viem)
 * Architecture: Frontend/Backend -> Vouch Blockchain SDK -> Viem -> MST Testnet -> Smart Contracts
 */

import type { Address, Hex } from "viem";
import { VouchSDK } from "../sdk/VouchSDK";
import {
  type GroupDetails,
  type MemberDetails,
  type SolvencyInfo,
  type CreateGroupParams,
  type CreateGroupResult,
  type TransactionResult,
  type PhaseType,
  PHASE_NAMES,
} from "../sdk/types";

export { PHASE_NAMES, type PhaseType, type GroupDetails, type MemberDetails, type SolvencyInfo };

// Global VouchSDK singleton instance
export const vouchSDK = new VouchSDK();

export class ContractService {
  private sdk: VouchSDK;

  constructor(injectedProvider?: any) {
    this.sdk = vouchSDK;
    if (injectedProvider) {
      this.sdk.connectInjectedProvider(injectedProvider).catch(() => {});
    }
  }

  public async setProvider(injectedProvider: any) {
    if (injectedProvider) {
      await this.sdk.connectInjectedProvider(injectedProvider);
    }
  }

  public async setSigner(signerOrProvider: any) {
    if (signerOrProvider && signerOrProvider.provider) {
      // Ethers Signer adapter
      const rawProvider = (signerOrProvider.provider as any)._networkProvider || (signerOrProvider.provider as any).provider || (window as any).ethereum;
      if (rawProvider) {
        await this.sdk.connectInjectedProvider(rawProvider);
      }
    } else if (signerOrProvider) {
      await this.sdk.connectInjectedProvider(signerOrProvider);
    }
  }

  public setPrivateKey(privateKey: Hex) {
    return this.sdk.connectPrivateKey(privateKey);
  }

  public getSDK(): VouchSDK {
    return this.sdk;
  }

  // ==========================================
  // Group Actions (Forwarded to VouchSDK)
  // ==========================================

  public async createGroup(params: {
    factoryAddress?: string;
    groupName: string;
    memberCount: number;
    installmentAmount: string;
    cycleDuration: number;
    discountCapBps: number;
    reserveFeeBps: number;
    safetyFactorBps?: number;
  }): Promise<{ txHash: string; groupAddress?: string }> {
    const result: CreateGroupResult = await this.sdk.createGroup({
      factoryAddress: params.factoryAddress as Address | undefined,
      groupName: params.groupName,
      memberCount: params.memberCount,
      installmentAmount: params.installmentAmount,
      cycleDuration: params.cycleDuration,
      discountCapBps: params.discountCapBps,
      reserveFeeBps: params.reserveFeeBps,
      safetyFactorBps: params.safetyFactorBps,
    });

    return {
      txHash: result.hash,
      groupAddress: result.groupAddress,
    };
  }

  public async joinGroup(groupAddress: string, bufferAmount: string): Promise<string> {
    const result = await this.sdk.joinGroup(groupAddress as Address, bufferAmount);
    return result.hash;
  }

  public async payInstallment(groupAddress: string, amount: string): Promise<string> {
    const result = await this.sdk.payInstallment(groupAddress as Address, amount);
    return result.hash;
  }

  public async depositCollateralBuffer(groupAddress: string, amount: string): Promise<string> {
    const result = await this.sdk.depositCollateralBuffer(groupAddress as Address, amount);
    return result.hash;
  }

  public async commitBid(
    groupAddress: string,
    bidAmountOrHash: string,
    salt: string = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  ): Promise<string> {
    const result = await this.sdk.commitBid(groupAddress as Address, bidAmountOrHash, salt);
    return result.hash;
  }

  public async revealBid(
    groupAddress: string,
    bidAmount: string,
    salt: string = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  ): Promise<string> {
    const result = await this.sdk.revealBid(groupAddress as Address, bidAmount, salt);
    return result.hash;
  }

  public async settleRound(groupAddress: string): Promise<string> {
    const result = await this.sdk.settleRound(groupAddress as Address);
    return result.hash;
  }

  public async settleAuction(groupAddress: string): Promise<string> {
    const result = await this.sdk.settleAuction(groupAddress as Address);
    return result.hash;
  }

  public async stakeVoucher(voucheeAddress: string, amount: string): Promise<string> {
    const result = await this.sdk.stakeVoucher(voucheeAddress as Address, amount);
    return result.hash;
  }

  // ==========================================
  // Read Queries
  // ==========================================

  public async getGroupDetails(groupAddress: string): Promise<GroupDetails> {
    return this.sdk.getGroupDetails(groupAddress as Address);
  }

  public async getMemberDetails(
    groupAddress: string,
    memberAddress: string
  ): Promise<MemberDetails> {
    return this.sdk.getMemberDetails(groupAddress as Address, memberAddress as Address);
  }

  public async checkSolvency(
    groupAddress: string,
    memberAddress: string
  ): Promise<SolvencyInfo> {
    return this.sdk.checkSolvency(groupAddress as Address, memberAddress as Address);
  }

  public async getBalance(address: string): Promise<string> {
    return this.sdk.getBalance(address as Address);
  }
}
