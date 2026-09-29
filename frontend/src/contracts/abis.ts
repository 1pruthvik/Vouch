export const ChitFactoryABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_vouchRegistry",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_yieldStrategy",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "groupAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "groupName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "memberCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "installmentAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cycleDuration",
        "type": "uint256"
      }
    ],
    "name": "GroupCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "groupName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "memberCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "installmentAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "cycleDuration",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "discountCapBps",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "reserveFeeBps",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "safetyFactorBps",
        "type": "uint256"
      }
    ],
    "name": "createGroup",
    "outputs": [
      {
        "internalType": "address",
        "name": "groupAddr",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "defaultYieldStrategy",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "deployedGroups",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDeployedGroups",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDeployedGroupsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isDeployedGroup",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_strategy",
        "type": "address"
      }
    ],
    "name": "setDefaultYieldStrategy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_vouchRegistry",
        "type": "address"
      }
    ],
    "name": "setVouchRegistry",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vouchRegistry",
    "outputs": [
      {
        "internalType": "contract VouchRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const ChitGroupABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_groupName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_memberCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_installmentAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_cycleDuration",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_discountCapBps",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_reserveFeeBps",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_safetyFactorBps",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_vouchRegistry",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_yieldStrategy",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "payout",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "dividendPerMember",
        "type": "uint256"
      }
    ],
    "name": "AuctionSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "commitmentHash",
        "type": "bytes32"
      }
    ],
    "name": "BidCommitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "bidAmount",
        "type": "uint256"
      }
    ],
    "name": "BidRevealed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "defaulter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "tierUsed",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "DefaultAbsorbed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "GroupClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "InstallmentCollected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "bufferDeposit",
        "type": "uint256"
      }
    ],
    "name": "MemberJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "enum ChitGroup.GroupState",
        "name": "newState",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      }
    ],
    "name": "PhaseChanged",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "advanceToCommit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "advanceToReveal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "memberAddr",
        "type": "address"
      }
    ],
    "name": "checkSolvency",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isSolvent",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "totalBacking",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "requiredBacking",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "commitmentHash",
        "type": "bytes32"
      }
    ],
    "name": "commitBid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentPot",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentRound",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentState",
    "outputs": [
      {
        "internalType": "enum ChitGroup.GroupState",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cycleDuration",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "discountCapBps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "factory",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMembers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "groupName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "installmentAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isMember",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "joinGroup",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lowestBidAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lowestBidder",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "memberCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "memberList",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "members",
    "outputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "bufferBalance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lockedDividends",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "paidInstallments",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "hasWon",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "winRound",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isDefaulted",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "payInstallment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "phaseStartTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reserveFeeBps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reserveFundBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bidAmount",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      }
    ],
    "name": "revealBid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "roundCommits",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "commitmentHash",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "committed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "roundReveals",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "bidAmount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "revealed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "safetyFactorBps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "settleRound",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vouchRegistry",
    "outputs": [
      {
        "internalType": "contract VouchRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "yieldStrategy",
    "outputs": [
      {
        "internalType": "contract IYieldStrategy",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

export const VouchRegistryABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "chitGroup",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "status",
        "type": "bool"
      }
    ],
    "name": "GroupAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voucher",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "StakeDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voucher",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "StakeWithdrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "voucher",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "vouchee",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "chitGroup",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "VouchRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voucher",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "vouchee",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "chitGroup",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "VoucherSlashed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_VOUCHEES_PER_VOUCHER",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "group",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "status",
        "type": "bool"
      }
    ],
    "name": "authorizeGroup",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedGroups",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositStake",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "voucher",
        "type": "address"
      }
    ],
    "name": "getFreeStake",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "records",
    "outputs": [
      {
        "internalType": "address",
        "name": "voucher",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "vouchee",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "chitGroup",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "stakedAmount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "vouchee",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "chitGroup",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "registerVouch",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "slashVoucher",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "slashed",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "voucheeRecords",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "vouchers",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalStaked",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lockedStake",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "reputationScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "activeVoucheeCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawStake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const ChitGroupBytecode = "0x6101806040523480156200001257600080fd5b5060405162002195380380620021958339810160408190526200003591620001b4565b60017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f005560018811620000af5760405162461bcd60e51b815260206004820152601860248201527f4d656d62657220636f756e74206d757374206265203e2031000000000000000060448201526064015b60405180910390fd5b611388851115620001035760405162461bcd60e51b815260206004820152601e60248201527f446973636f756e74206361702063616e6e6f74206578636565642035302500006044820152606401620000a6565b6000620001118a826200037a565b50608088905260a087905260c086905260e0859052610100849052826200013b576127106200013d565b825b6101205233610140526001600160a01b0391821661016052600180546001600160a81b03191691909216179055505060006002555050426003555062000446915050565b634e487b7160e01b600052604160045260246000fd5b80516001600160a01b0381168114620001af57600080fd5b919050565b60008060008060008060008060006101208a8c031215620001d457600080fd5b89516001600160401b0380821115620001ec57600080fd5b818c0191508c601f8301126200020157600080fd5b81518181111562000216576200021662000181565b604051601f8201601f19908116603f0116810190838211818310171562000241576200024162000181565b81604052828152602093508f848487010111156200025e57600080fd5b600091505b8282101562000282578482018401518183018501529083019062000263565b6000848483010152809d50505050808c01519950505060408a0151965060608a0151955060808a0151945060a08a0151935060c08a01519250620002c960e08b0162000197565b9150620002da6101008b0162000197565b90509295985092959850929598565b600181811c90821680620002fe57607f821691505b6020821081036200031f57634e487b7160e01b600052602260045260246000fd5b50919050565b601f82111562000375576000816000526020600020601f850160051c81016020861015620003505750805b601f850160051c820191505b8181101562000371578281556001016200035c565b5050505b505050565b81516001600160401b0381111562000396576200039662000181565b620003ae81620003a78454620002e9565b8462000325565b602080601f831160018114620003e65760008415620003cd5750858301515b600019600386901b1c1916600185901b17855562000371565b600085815260208120601f198616915b828110156200041757888601518255948401946001909101908401620003f6565b5085821015620004365787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b60805160a05160c05160e05161010051610120516101405161016051611c796200051c6000396000610690015260006106e40152600081816105cf01526111180152600081816104b50152610d140152600081816102d70152610a440152600061044a01526000818161057d015281816109f301528181610c62015281816110e90152818161142701526117ec01526000818161031901528181610a1401528181610c8301528181610d7201528181610ef801528181611087015281816110bc015281816113cc01526115c20152611c796000f3fe6080604052600436106101dc5760003560e01c8063784042f011610102578063a576e9ae11610095578063c45a015511610064578063c45a0155146106d2578063e134933314610706578063e9e1965d14610726578063f852b8db1461072e57600080fd5b8063a576e9ae14610653578063a69fe0dd14610668578063aa618fb61461067e578063b307fc6d146106b257600080fd5b80639ac79e0a116100d15780639ac79e0a146105b55780639b4d1a83146105bd5780639eab5253146105f1578063a230c5241461061357600080fd5b8063784042f01461050e57806386a2cc271461054b5780638770998e1461056b5780638a19c8bc1461059f57600080fd5b80634cff1bcf1161017a57806362c5424a1161014957806362c5424a1461048357806365db6579146104a35780636ffbfaa8146104d7578063783cec80146104ec57600080fd5b80634cff1bcf146103e0578063574479e6146104225780635bec4cb414610438578063606868d61461046c57600080fd5b806311aee380116101b657806311aee3801461030757806312f3d0c21461033b57806313f14fee1461035157806333cce17b1461038957600080fd5b806308ae4b0c146101e85780630c3f6acf146102975780630d1e0661146102c557600080fd5b366101e357005b600080fd5b3480156101f457600080fd5b5061024f610203366004611959565b60076020526000908152604090208054600182015460028301546003840154600485015460058601546006909601546001600160a01b039095169593949293919260ff91821692911687565b604080516001600160a01b03909816885260208801969096529486019390935260608501919091521515608084015260a0830152151560c082015260e0015b60405180910390f35b3480156102a357600080fd5b506001546102b890600160a01b900460ff1681565b60405161028e91906119b3565b3480156102d157600080fd5b506102f97f000000000000000000000000000000000000000000000000000000000000000081565b60405190815260200161028e565b34801561031357600080fd5b506102f97f000000000000000000000000000000000000000000000000000000000000000081565b34801561034757600080fd5b506102f960035481565b34801561035d57600080fd5b50600154610371906001600160a01b031681565b6040516001600160a01b03909116815260200161028e565b34801561039557600080fd5b506103cb6103a43660046119c7565b600a6020908152600092835260408084209091529082529020805460019091015460ff1682565b6040805192835290151560208301520161028e565b3480156103ec57600080fd5b506103cb6103fb3660046119c7565b60096020908152600092835260408084209091529082529020805460019091015460ff1682565b34801561042e57600080fd5b506102f960055481565b34801561044457600080fd5b506102f97f000000000000000000000000000000000000000000000000000000000000000081565b34801561047857600080fd5b50610481610744565b005b34801561048f57600080fd5b5061048161049e3660046119f3565b610824565b3480156104af57600080fd5b506102f97f000000000000000000000000000000000000000000000000000000000000000081565b3480156104e357600080fd5b50610481610b93565b3480156104f857600080fd5b50610501610fd6565b60405161028e9190611a15565b34801561051a57600080fd5b5061052e610529366004611959565b611064565b60408051931515845260208401929092529082015260600161028e565b34801561055757600080fd5b50610481610566366004611a64565b61116f565b34801561057757600080fd5b506102f97f000000000000000000000000000000000000000000000000000000000000000081565b3480156105ab57600080fd5b506102f960025481565b61048161132e565b3480156105c957600080fd5b506102f97f000000000000000000000000000000000000000000000000000000000000000081565b3480156105fd57600080fd5b50610606611644565b60405161028e9190611a7d565b34801561061f57600080fd5b5061064361062e366004611959565b60086020526000908152604090205460ff1681565b604051901515815260200161028e565b34801561065f57600080fd5b506104816116a6565b34801561067457600080fd5b506102f960045481565b34801561068a57600080fd5b506103717f000000000000000000000000000000000000000000000000000000000000000081565b3480156106be57600080fd5b506103716106cd366004611a64565b61174b565b3480156106de57600080fd5b506103717f000000000000000000000000000000000000000000000000000000000000000081565b34801561071257600080fd5b50600b54610371906001600160a01b031681565b610481611775565b34801561073a57600080fd5b506102f9600c5481565b61074c6118f1565b60018054600160a01b900460ff16600581111561076b5761076b61197b565b146107b45760405162461bcd60e51b81526020600482015260146024820152734e6f7420696e20436f6c6c65637420706861736560601b60448201526064015b60405180910390fd5b6001805460ff60a01b1916600160a11b17905542600355600019600c55600b80546001600160a01b031916905560028054604051600080516020611c2483398151915292610803929091611aca565b60405180910390a16108226001600080516020611c0483398151915255565b565b3360009081526008602052604090205460ff166108535760405162461bcd60e51b81526004016107ab90611ae5565b600380600154600160a01b900460ff1660058111156108745761087461197b565b146108915760405162461bcd60e51b81526004016107ab90611b11565b60025460009081526009602090815260408083203384529091529020600181015460ff166108f75760405162461bcd60e51b8152602060048201526013602482015272139bc818dbdb5b5a5d1b595b9d08199bdd5b99606a1b60448201526064016107ab565b6002546000908152600a6020908152604080832033845290915290206001015460ff161561095a5760405162461bcd60e51b815260206004820152601060248201526f105b1c9958591e481c995d99585b195960821b60448201526064016107ab565b8054604080516020810187905290810185905233606090811b6bffffffffffffffffffffffff19169082015260740160405160208183030381529060405280519060200120146109ec5760405162461bcd60e51b815260206004820152601d60248201527f496e76616c69642072657665616c2073616c74206f7220616d6f756e7400000060448201526064016107ab565b6000610a387f00000000000000000000000000000000000000000000000000000000000000007f0000000000000000000000000000000000000000000000000000000000000000611b54565b90506000612710610a697f000000000000000000000000000000000000000000000000000000000000000084611b54565b610a739190611b6b565b610a7d9083611b8d565b9050808610158015610a8f5750818611155b610ae65760405162461bcd60e51b815260206004820152602260248201527f426964206f75747369646520616c6c6f77656420646973636f756e742072616e604482015261676560f01b60648201526084016107ab565b604080518082018252878152600160208083018281526002546000908152600a83528581203382529092529390209151825591519101805460ff1916911515919091179055600c54861015610b4d57600c869055600b80546001600160a01b031916331790555b600254604080519182526020820188905233917f42fe7ae84c5903883bb9f7b372fde1918ff6e6254cdd0bb34c64188d2caf8d1c910160405180910390a2505050505050565b610b9b6118f1565b6003600154600160a01b900460ff166005811115610bbb57610bbb61197b565b14610bfe5760405162461bcd60e51b81526020600482015260136024820152724e6f7420696e2052657665616c20706861736560681b60448201526064016107ab565b600b546000906001600160a01b0316610c4c5760066001600254610c229190611b8d565b81548110610c3257610c32611ba0565b6000918252602090912001546001600160a01b0316610c59565b600b546001600160a01b03165b90506000610ca77f00000000000000000000000000000000000000000000000000000000000000007f0000000000000000000000000000000000000000000000000000000000000000611b54565b9050600081600c5410610cba5781610cbe565b600c545b6001600160a01b038416600090815260076020526040812060048101805460ff191660011790556002546005820155919250828411610cfe576000610d08565b610d088385611b8d565b90506000612710610d397f000000000000000000000000000000000000000000000000000000000000000084611b54565b610d439190611b6b565b90508060046000828254610d579190611bb6565b9091555060009050610d698284611b8d565b90506000610d977f000000000000000000000000000000000000000000000000000000000000000083611b6b565b905060005b600654811015610e0257816007600060068481548110610dbe57610dbe611ba0565b60009182526020808320909101546001600160a01b0316835282019290925260400181206002018054909190610df5908490611bb6565b9091555050600101610d9c565b506000886001600160a01b03168760405160006040518083038185875af1925050503d8060008114610e50576040519150601f19603f3d011682016040523d82523d6000602084013e610e55565b606091505b5050905080610ea65760405162461bcd60e51b815260206004820152601d60248201527f57696e6e6572207061796f7574207472616e73666572206661696c656400000060448201526064016107ab565b60025460408051898152602081018590526001600160a01b038c1692917ff3f2616e1974d63dd639b6a9ee3bb862a76b9bb4909e0a92a1e95b475e3821b7910160405180910390a360006005556002547f000000000000000000000000000000000000000000000000000000000000000011610f5d576001805460ff60a01b1916600560a01b1790556040517faf2077a51188e4d9cdccf33ab24401a400c4620705c401eb8939e2ce8e41d94990600090a1610fb6565b600160026000828254610f709190611bb6565b90915550506001805460ff60a01b1916600160a01b17815542600355600254604051600080516020611c2483398151915292610fad929091611aca565b60405180910390a15b5050505050505050506108226001600080516020611c0483398151915255565b60008054610fe390611bc9565b80601f016020809104026020016040519081016040528092919081815260200182805461100f90611bc9565b801561105c5780601f106110315761010080835404028352916020019161105c565b820191906000526020600020905b81548152906001019060200180831161103f57829003601f168201915b505050505081565b6001600160a01b03811660009081526007602052604081206002548291829182907f000000000000000000000000000000000000000000000000000000000000000010156110b35760006110e0565b6002546110e0907f0000000000000000000000000000000000000000000000000000000000000000611b8d565b9050600061110e7f000000000000000000000000000000000000000000000000000000000000000083611b54565b905061271061113d7f000000000000000000000000000000000000000000000000000000000000000083611b54565b6111479190611b6b565b93508260020154836001015461115d9190611bb6565b94508385101595505050509193909250565b3360009081526008602052604090205460ff1661119e5760405162461bcd60e51b81526004016107ab90611ae5565b600280600154600160a01b900460ff1660058111156111bf576111bf61197b565b146111dc5760405162461bcd60e51b81526004016107ab90611b11565b336000908152600760205260409020600481015460ff16156112405760405162461bcd60e51b815260206004820152601860248201527f4d656d62657220616c726561647920776f6e206120706f74000000000000000060448201526064016107ab565b600254600090815260096020908152604080832033845290915290206001015460ff16156112a45760405162461bcd60e51b8152602060048201526011602482015270105b1c9958591e4818dbdb5b5a5d1d1959607a1b60448201526064016107ab565b6040805180820182528481526001602080830182815260028054600090815260098452868120338083529085529087902095518655915194909301805460ff1916941515949094179093559054835190815290810186905290917fae302e11fa11d87a87e7f34fab4a1485a04361a80dc1e48551ed445b1325ef3b910160405180910390a2505050565b600080600154600160a01b900460ff16600581111561134f5761134f61197b565b1461136c5760405162461bcd60e51b81526004016107ab90611b11565b6113746118f1565b3360009081526008602052604090205460ff16156113c75760405162461bcd60e51b815260206004820152601060248201526f20b63932b0b23c90309036b2b6b132b960811b60448201526064016107ab565b6006547f0000000000000000000000000000000000000000000000000000000000000000116114255760405162461bcd60e51b815260206004820152600a60248201526911dc9bdd5c08199d5b1b60b21b60448201526064016107ab565b7f00000000000000000000000000000000000000000000000000000000000000003410156114955760405162461bcd60e51b815260206004820152601f60248201527f427566666572206d757374206265203e3d203120696e7374616c6c6d656e740060448201526064016107ab565b3360008181526008602090815260408083208054600160ff1991821681179092556006805480840182557ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f0180546001600160a01b03199081168917909155845160e081018652888152348188018181528288018a8152606084018b8152608085018c815260a086018d815260c087018e81528f8f5260078e529d8c9020965187549098166001600160a01b0390981697909717865592519885019890985551600284015595516003830155945160048201805486169115159190911790559051600582015595519501805490911694151594909417909355519182527f7f3b9effe05cfb4f31f854004de03199fd03fe56bf38a48b2aa9a9f4402d6e23910160405180910390a26006547f0000000000000000000000000000000000000000000000000000000000000000900361162a576001805460ff60a01b1916600160a01b178155600281905542600355604051600080516020611c2483398151915291611621918190611aca565b60405180910390a15b6116416001600080516020611c0483398151915255565b50565b6060600680548060200260200160405190810160405280929190818152602001828054801561169c57602002820191906000526020600020905b81546001600160a01b0316815260019091019060200180831161167e575b5050505050905090565b6116ae6118f1565b6002600154600160a01b900460ff1660058111156116ce576116ce61197b565b146117115760405162461bcd60e51b81526020600482015260136024820152724e6f7420696e20436f6d6d697420706861736560681b60448201526064016107ab565b6001805460ff60a01b1916600360a01b179055426003908155600254604051600080516020611c2483398151915292610803929091611aca565b6006818154811061175b57600080fd5b6000918252602090912001546001600160a01b0316905081565b3360009081526008602052604090205460ff166117a45760405162461bcd60e51b81526004016107ab90611ae5565b600180600154600160a01b900460ff1660058111156117c5576117c561197b565b146117e25760405162461bcd60e51b81526004016107ab90611b11565b6117ea6118f1565b7f000000000000000000000000000000000000000000000000000000000000000034146118595760405162461bcd60e51b815260206004820152601c60248201527f496e636f727265637420696e7374616c6c6d656e7420616d6f756e740000000060448201526064016107ab565b336000908152600760205260408120600381018054919260019261187e908490611bb6565b9250508190555034600560008282546118979190611bb6565b90915550506002546040805191825234602083015233917f18689a180a741f5795ea1b200edb18fd27d45f3e5ae008cd9201fc3220ee12bd910160405180910390a2506116416001600080516020611c0483398151915255565b6118f961190d565b6002600080516020611c0483398151915255565b600080516020611c048339815191525460020361082257604051633ee5aeb560e01b815260040160405180910390fd5b80356001600160a01b038116811461195457600080fd5b919050565b60006020828403121561196b57600080fd5b6119748261193d565b9392505050565b634e487b7160e01b600052602160045260246000fd5b600681106119af57634e487b7160e01b600052602160045260246000fd5b9052565b602081016119c18284611991565b92915050565b600080604083850312156119da57600080fd5b823591506119ea6020840161193d565b90509250929050565b60008060408385031215611a0657600080fd5b50508035926020909101359150565b60006020808352835180602085015260005b81811015611a4357858101830151858201604001528201611a27565b506000604082860101526040601f19601f8301168501019250505092915050565b600060208284031215611a7657600080fd5b5035919050565b6020808252825182820181905260009190848201906040850190845b81811015611abe5783516001600160a01b031683529284019291840191600101611a99565b50909695505050505050565b60408101611ad88285611991565b8260208301529392505050565b6020808252601290820152712737ba10309033b937bab81036b2b6b132b960711b604082015260600190565b602080825260139082015272496e76616c696420706861736520737461746560681b604082015260600190565b634e487b7160e01b600052601160045260246000fd5b80820281158282048414176119c1576119c1611b3e565b600082611b8857634e487b7160e01b600052601260045260246000fd5b500490565b818103818111156119c1576119c1611b3e565b634e487b7160e01b600052603260045260246000fd5b808201808211156119c1576119c1611b3e565b600181811c90821680611bdd57607f821691505b602082108103611bfd57634e487b7160e01b600052602260045260246000fd5b5091905056fe9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00e65264342b0c60a079c9c89c73855ac517088348498810186d8c8ae6c7848ba1a26469706673582212208f95862ea54a22714547c1502d544626cc04cdf5f33f1a449f206ab032bb69a364736f6c63430008180033";
