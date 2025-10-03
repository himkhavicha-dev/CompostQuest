# 🌱 CompostQuest: Gamified Composting Rewards Platform

Welcome to CompostQuest, a Web3 platform that turns household composting into a fun, rewarding game! By leveraging the Stacks blockchain and Clarity smart contracts, we incentivize sustainable waste management to reduce landfill waste, lower greenhouse gas emissions, and promote eco-friendly habits. Households earn tokens for verified composting efforts, compete on leaderboards, and unlock badges—solving the real-world problem of low composting adoption rates due to lack of motivation and verification.

## ✨ Features

🌟 Gamified rewards: Earn compost tokens (CMPT) for verified composting activities  
✅ Verification system: Submit proof (e.g., via oracles or community validation) to claim rewards  
🏆 Leaderboards: Track top composters by household or region  
🎖️ Achievement badges: NFTs for milestones like "100kg Composted"  
🤝 Community governance: Vote on platform updates using staked tokens  
💰 Token staking: Stake CMPT for bonus rewards and multipliers  
📈 Marketplace: Trade tokens or buy eco-products with rewards  
🔒 Secure registrations: Prevent fraud with unique household IDs  
📊 Analytics dashboard: View personal composting impact stats  
🚫 Anti-cheat mechanisms: Time-locked submissions and oracle integrations

## 🛠 How It Works

CompostQuest uses 8 interconnected Clarity smart contracts on the Stacks blockchain to handle everything from user onboarding to rewards distribution. Here's a high-level overview:

### Smart Contracts Overview

1. **UserRegistry.clar**: Handles household registration, assigning unique IDs and storing basic info like location. Ensures one account per household to prevent duplicates.
   
2. **CompostVerifier.clar**: Allows users to submit composting proofs (e.g., weight logs or photos hashed for privacy). Integrates with oracles for automated verification or community voting.

3. **RewardToken.clar**: Manages the fungible CMPT token (SIP-10 compliant). Mints tokens based on verified efforts, with formulas like 1 CMPT per kg composted.

4. **Leaderboard.clar**: Tracks scores, rankings, and seasonal leaderboards. Updates in real-time as rewards are claimed, with queries for top performers.

5. **AchievementNFT.clar**: Mints non-fungible tokens (SIP-9 compliant) as badges for achievements. Triggers automatically on milestones from the verifier contract.

6. **StakingPool.clar**: Enables users to stake CMPT tokens for yield farming-style bonuses, like reward multipliers on future composting efforts.

7. **GovernanceDAO.clar**: A simple DAO for proposals and voting. Staked token holders vote on parameters like reward rates or new features.

8. **EcoMarketplace.clar**: A decentralized marketplace for trading CMPT or using them to purchase virtual eco-items (e.g., NFTs for virtual gardens) or partner discounts.

### For Households (Users)

- Register your household via UserRegistry.clar with a unique address and proof of residence hash.
- Track your composting: Weigh and log your compost, generate a hash, and submit to CompostVerifier.clar.
- Get verified: Use an oracle (e.g., integrated sensor data) or community vote to confirm your submission.
- Claim rewards: Call functions in RewardToken.clar to mint CMPT based on verified amounts.
- Level up: Automatically receive NFTs from AchievementNFT.clar for hitting goals.
- Stake and compete: Stake tokens in StakingPool.clar for bonuses, and climb the Leaderboard.clar rankings.
- Participate: Vote in GovernanceDAO.clar or shop in EcoMarketplace.clar.

Boom! You're now a composting hero, earning real value while helping the planet.

### For Verifiers/Community

- Use query functions in CompostVerifier.clar to review submissions.
- Vote on disputes via GovernanceDAO.clar.
- Check leaderboards and user stats for transparency.

### Technical Notes

- All contracts are written in Clarity for security and predictability.
- Inter-contract calls ensure atomic operations (e.g., verification triggers reward minting).
- Oracles (external to contracts) handle real-world data input to avoid centralization.
- Total contracts: 8, providing modularity for easy upgrades.

Get started by deploying these contracts on Stacks testnet and building a frontend dApp to interact with them. Let's make composting fun and rewarding! 🚀