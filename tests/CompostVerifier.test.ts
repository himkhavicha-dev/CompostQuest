import { describe, it, expect, beforeEach } from "vitest";
import { stringUtf8CV, uintCV, principalCV, buffCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_ALREADY_SUBMITTED = 101;
const ERR_INVALID_PROOF = 102;
const ERR_SUBMISSION_EXPIRED = 103;
const ERR_INVALID_WEIGHT = 104;
const ERR_ORACLE_NOT_SET = 105;
const ERR_INVALID_SUBMISSION_ID = 106;
const ERR_VERIFICATION_FAILED = 107;
const ERR_REWARD_ALREADY_CLAIMED = 108;
const ERR_INVALID_TIMESTAMP = 109;
const ERR_USER_NOT_REGISTERED = 110;
const ERR_INVALID_ORACLE = 111;
const ERR_MAX_SUBMISSIONS_EXCEEDED = 112;
const ERR_INVALID_REWARD_RATE = 113;
const ERR_INVALID_STATUS = 114;
const ERR_INVALID_LOCATION = 115;
const ERR_INVALID_PROOF_TYPE = 116;
const ERR_PENDING_VERIFICATION = 117;
const ERR_INVALID_CHALLENGE = 118;
const ERR_CHALLENGE_EXPIRED = 119;
const ERR_INVALID_VOTE = 120;

interface Submission {
  proofHash: Buffer;
  weight: number;
  timestamp: number;
  status: number;
  proofType: string;
  location: string;
}

interface Verification {
  verifier: string;
  vote: boolean;
  timestamp: number;
}

interface Challenge {
  challenger: string;
  reason: string;
  timestamp: number;
  status: boolean;
}

interface UserRegistration {
  registeredAt: number;
  active: boolean;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class CompostVerifierMock {
  state: {
    oraclePrincipal: string;
    submissionTimeout: number;
    maxSubmissionsPerUser: number;
    rewardRate: number;
    contractOwner: string;
    verificationFee: number;
    challengePeriod: number;
    votingThreshold: number;
    submissions: Map<string, Submission>;
    userSubmissionsCount: Map<string, number>;
    verifications: Map<string, Verification>;
    challenges: Map<string, Challenge>;
    rewardsClaimed: Map<string, boolean>;
    userRegistrations: Map<string, UserRegistration>;
  } = {
    oraclePrincipal: "ST1TEST",
    submissionTimeout: 144,
    maxSubmissionsPerUser: 10,
    rewardRate: 1,
    contractOwner: "ST1TEST",
    verificationFee: 50,
    challengePeriod: 72,
    votingThreshold: 51,
    submissions: new Map(),
    userSubmissionsCount: new Map(),
    verifications: new Map(),
    challenges: new Map(),
    rewardsClaimed: new Map(),
    userRegistrations: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string }> = [];
  mintedRewards: Array<{ amount: number; to: string }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      oraclePrincipal: "ST1TEST",
      submissionTimeout: 144,
      maxSubmissionsPerUser: 10,
      rewardRate: 1,
      contractOwner: "ST1TEST",
      verificationFee: 50,
      challengePeriod: 72,
      votingThreshold: 51,
      submissions: new Map(),
      userSubmissionsCount: new Map(),
      verifications: new Map(),
      challenges: new Map(),
      rewardsClaimed: new Map(),
      userRegistrations: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
    this.mintedRewards = [];
  }

  setOracle(newOracle: string): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.oraclePrincipal = newOracle;
    return { ok: true, value: true };
  }

  setSubmissionTimeout(newTimeout: number): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newTimeout <= 0) return { ok: false, value: ERR_INVALID_TIMESTAMP };
    this.state.submissionTimeout = newTimeout;
    return { ok: true, value: true };
  }

  setMaxSubmissions(newMax: number): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newMax <= 0) return { ok: false, value: ERR_MAX_SUBMISSIONS_EXCEEDED };
    this.state.maxSubmissionsPerUser = newMax;
    return { ok: true, value: true };
  }

  setRewardRate(newRate: number): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newRate <= 0) return { ok: false, value: ERR_INVALID_REWARD_RATE };
    this.state.rewardRate = newRate;
    return { ok: true, value: true };
  }

  setVerificationFee(newFee: number): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newFee < 0) return { ok: false, value: ERR_INVALID_UPDATE_PARAM };
    this.state.verificationFee = newFee;
    return { ok: true, value: true };
  }

  setChallengePeriod(newPeriod: number): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newPeriod <= 0) return { ok: false, value: ERR_INVALID_TIMESTAMP };
    this.state.challengePeriod = newPeriod;
    return { ok: true, value: true };
  }

  setVotingThreshold(newThreshold: number): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newThreshold <= 0 || newThreshold > 100) return { ok: false, value: ERR_INVALID_VOTING_THRESHOLD };
    this.state.votingThreshold = newThreshold;
    return { ok: true, value: true };
  }

  registerUser(): Result<boolean> {
    if (this.state.userRegistrations.has(this.caller)) return { ok: false, value: ERR_ALREADY_REGISTERED };
    this.state.userRegistrations.set(this.caller, { registeredAt: this.blockHeight, active: true });
    return { ok: true, value: true };
  }

  submitProof(proofHash: Buffer, weight: number, proofType: string, location: string): Result<number> {
    if (!this.state.userRegistrations.get(this.caller)?.active) return { ok: false, value: ERR_USER_NOT_REGISTERED };
    const count = this.state.userSubmissionsCount.get(this.caller) || 0;
    if (count >= this.state.maxSubmissionsPerUser) return { ok: false, value: ERR_MAX_SUBMISSIONS_EXCEEDED };
    if (proofHash.length !== 32) return { ok: false, value: ERR_INVALID_PROOF };
    if (weight <= 0 || weight > 10000) return { ok: false, value: ERR_INVALID_WEIGHT };
    if (!["photo", "sensor", "manual"].includes(proofType)) return { ok: false, value: ERR_INVALID_PROOF_TYPE };
    if (location.length === 0 || location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    const subId = count;
    const key = `${this.caller}-${subId}`;
    this.state.submissions.set(key, { proofHash, weight, timestamp: this.blockHeight, status: 0, proofType, location });
    this.state.userSubmissionsCount.set(this.caller, count + 1);
    return { ok: true, value: subId };
  }

  verifySubmission(subUser: string, subId: number, vote: boolean): Result<boolean> {
    const key = `${subUser}-${subId}`;
    const sub = this.state.submissions.get(key);
    if (!sub) return { ok: false, value: ERR_INVALID_SUBMISSION_ID };
    if (this.caller !== this.state.oraclePrincipal) return { ok: false, value: ERR_INVALID_ORACLE };
    if (this.state.verifications.has(key)) return { ok: false, value: ERR_ALREADY_VERIFIED };
    if (sub.timestamp > this.blockHeight + this.state.submissionTimeout) return { ok: false, value: ERR_SUBMISSION_EXPIRED };
    this.stxTransfers.push({ amount: this.state.verificationFee, from: this.caller, to: this.state.contractOwner });
    this.state.verifications.set(key, { verifier: this.caller, vote, timestamp: this.blockHeight });
    sub.status = vote ? 1 : 2;
    this.state.submissions.set(key, sub);
    return { ok: true, value: vote };
  }

  challengeSubmission(subUser: string, subId: number, reason: string): Result<boolean> {
    const key = `${subUser}-${subId}`;
    const sub = this.state.submissions.get(key);
    if (!sub) return { ok: false, value: ERR_INVALID_SUBMISSION_ID };
    if (this.caller === subUser) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (this.state.challenges.has(key)) return { ok: false, value: ERR_ALREADY_CHALLENGED };
    if (sub.timestamp > this.blockHeight + this.state.challengePeriod) return { ok: false, value: ERR_CHALLENGE_EXPIRED };
    if (reason.length > 200) return { ok: false, value: ERR_INVALID_CHALLENGE };
    this.state.challenges.set(key, { challenger: this.caller, reason, timestamp: this.blockHeight, status: true });
    sub.status = 3;
    this.state.submissions.set(key, sub);
    return { ok: true, value: true };
  }

  resolveChallenge(subUser: string, subId: number, resolvedVote: boolean): Result<boolean> {
    const key = `${subUser}-${subId}`;
    const chal = this.state.challenges.get(key);
    const sub = this.state.submissions.get(key);
    if (!chal) return { ok: false, value: ERR_INVALID_CHALLENGE };
    if (this.caller !== this.state.oraclePrincipal) return { ok: false, value: ERR_INVALID_ORACLE };
    if (!chal.status) return { ok: false, value: ERR_INVALID_STATUS };
    chal.status = false;
    this.state.challenges.set(key, chal);
    if (sub) {
      sub.status = resolvedVote ? 1 : 2;
      this.state.submissions.set(key, sub);
    }
    return { ok: true, value: resolvedVote };
  }

  claimReward(subId: number): Result<number> {
    const key = `${this.caller}-${subId}`;
    const sub = this.state.submissions.get(key);
    if (!sub) return { ok: false, value: ERR_INVALID_SUBMISSION_ID };
    if (sub.status !== 1) return { ok: false, value: ERR_VERIFICATION_FAILED };
    if (this.state.rewardsClaimed.get(key) === true) return { ok: false, value: ERR_REWARD_ALREADY_CLAIMED };
    const reward = sub.weight * this.state.rewardRate;
    this.state.rewardsClaimed.set(key, true);
    this.mintedRewards.push({ amount: reward, to: this.caller });
    return { ok: true, value: reward };
  }

  getSubmission(user: string, id: number): Submission | undefined {
    return this.state.submissions.get(`${user}-${id}`);
  }

  getUserSubmissionsCount(user: string): number {
    return this.state.userSubmissionsCount.get(user) || 0;
  }

  isRewardClaimed(user: string, id: number): boolean {
    return this.state.rewardsClaimed.get(`${user}-${id}`) || false;
  }

  isUserRegistered(user: string): boolean {
    return this.state.userRegistrations.get(user)?.active || false;
  }
}

describe("CompostVerifier", () => {
  let contract: CompostVerifierMock;

  beforeEach(() => {
    contract = new CompostVerifierMock();
    contract.reset();
  });

  it("registers a user successfully", () => {
    const result = contract.registerUser();
    expect(result.ok).toBe(true);
    expect(contract.isUserRegistered("ST1TEST")).toBe(true);
  });

  it("submits proof successfully", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    const result = contract.submitProof(proofHash, 500, "photo", "Backyard");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const sub = contract.getSubmission("ST1TEST", 0);
    expect(sub?.weight).toBe(500);
    expect(sub?.proofType).toBe("photo");
    expect(contract.getUserSubmissionsCount("ST1TEST")).toBe(1);
  });

  it("rejects submission from unregistered user", () => {
    const proofHash = Buffer.alloc(32);
    const result = contract.submitProof(proofHash, 500, "photo", "Backyard");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_USER_NOT_REGISTERED);
  });

  it("rejects invalid proof hash", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(31);
    const result = contract.submitProof(proofHash, 500, "photo", "Backyard");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PROOF);
  });

  it("rejects invalid weight", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    const result = contract.submitProof(proofHash, 0, "photo", "Backyard");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_WEIGHT);
  });

  it("rejects max submissions exceeded", () => {
    contract.registerUser();
    contract.state.maxSubmissionsPerUser = 1;
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    const result = contract.submitProof(proofHash, 600, "sensor", "Garden");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_SUBMISSIONS_EXCEEDED);
  });

  it("verifies submission successfully", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    contract.caller = contract.state.oraclePrincipal;
    const result = contract.verifySubmission("ST1TEST", 0, true);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const sub = contract.getSubmission("ST1TEST", 0);
    expect(sub?.status).toBe(1);
    expect(contract.stxTransfers).toEqual([{ amount: 50, from: "ST1TEST", to: "ST1TEST" }]);
  });

  it("rejects verification by non-oracle", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    contract.caller = "ST2FAKE";
    const result = contract.verifySubmission("ST1TEST", 0, true);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_ORACLE);
  });

  it("challenges submission successfully", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    contract.caller = "ST3CHALLENGER";
    const result = contract.challengeSubmission("ST1TEST", 0, "Fake proof");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const sub = contract.getSubmission("ST1TEST", 0);
    expect(sub?.status).toBe(3);
    const chal = contract.state.challenges.get("ST1TEST-0");
    expect(chal?.reason).toBe("Fake proof");
  });

  it("rejects challenge by submitter", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    const result = contract.challengeSubmission("ST1TEST", 0, "Fake proof");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("resolves challenge successfully", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    contract.caller = "ST3CHALLENGER";
    contract.challengeSubmission("ST1TEST", 0, "Fake proof");
    contract.caller = contract.state.oraclePrincipal;
    const result = contract.resolveChallenge("ST1TEST", 0, true);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const sub = contract.getSubmission("ST1TEST", 0);
    expect(sub?.status).toBe(1);
    const chal = contract.state.challenges.get("ST1TEST-0");
    expect(chal?.status).toBe(false);
  });

  it("rejects resolve by non-oracle", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    contract.caller = "ST3CHALLENGER";
    contract.challengeSubmission("ST1TEST", 0, "Fake proof");
    contract.caller = "ST4FAKE";
    const result = contract.resolveChallenge("ST1TEST", 0, true);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_ORACLE);
  });

  it("claims reward successfully", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    contract.caller = contract.state.oraclePrincipal;
    contract.verifySubmission("ST1TEST", 0, true);
    contract.caller = "ST1TEST";
    const result = contract.claimReward(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(500);
    expect(contract.isRewardClaimed("ST1TEST", 0)).toBe(true);
    expect(contract.mintedRewards).toEqual([{ amount: 500, to: "ST1TEST" }]);
  });

  it("rejects claim without verification", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    const result = contract.claimReward(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_VERIFICATION_FAILED);
  });

  it("rejects double claim", () => {
    contract.registerUser();
    const proofHash = Buffer.alloc(32);
    contract.submitProof(proofHash, 500, "photo", "Backyard");
    contract.caller = contract.state.oraclePrincipal;
    contract.verifySubmission("ST1TEST", 0, true);
    contract.caller = "ST1TEST";
    contract.claimReward(0);
    const result = contract.claimReward(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_REWARD_ALREADY_CLAIMED);
  });

  it("sets oracle successfully", () => {
    const result = contract.setOracle("ST2NEWORACLE");
    expect(result.ok).toBe(true);
    expect(contract.state.oraclePrincipal).toBe("ST2NEWORACLE");
  });

  it("rejects set oracle by non-owner", () => {
    contract.caller = "ST2FAKE";
    const result = contract.setOracle("ST3NEW");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("sets reward rate successfully", () => {
    const result = contract.setRewardRate(2);
    expect(result.ok).toBe(true);
    expect(contract.state.rewardRate).toBe(2);
  });

  it("rejects invalid reward rate", () => {
    const result = contract.setRewardRate(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_REWARD_RATE);
  });
});