# Zodiac Card 🌟

> A decentralized fortune-telling NFT platform where users can mint unique zodiac-based fortune cards powered by AI.

## Overview

Zodiac Card is a Web3 application that combines astrology, NFTs, and AI to create unique fortune-telling experiences. Users can mint NFTs representing personalized fortune cards based on their zodiac sign, birth date, and current celestial alignments. Built as a Farcaster Frame-enabled Mini App and deployed on Base blockchain, it provides a seamless social and web3 experience for the Farcaster community.

## Features

- 🎴 Mint unique Zodiac Fortune NFTs
- 🔮 AI-powered fortune predictions
- ⭐ Zodiac sign compatibility matching
- 🌌 Real-time celestial alignment integration
- 💫 Interactive card viewing experience
- 🔄 Secondary market trading capabilities
- 🖼️ Farcaster Frames integration for social sharing
- 🌐 Native Base blockchain deployment
- 📱 Optimized for Farcaster Mini App experience

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI
- **Blockchain**: Solidity, Hardhat, Base Network
- **Web3**: Viem v2, Wagmi v2
- **AI/ML**: OpenAI GPT-4
- **Authentication**: NextAuth.js, Wallet Connect
- **Testing**: Vitest, Hardhat Test
- **Farcaster**: Frames SDK, Neynar API

## Architecture

```mermaid
graph TB
    subgraph Frontend
        UI[User Interface]
        WC[Wallet Connection]
        AI[AI Integration]
    end

    subgraph Backend
        API[Next.js API Routes]
        Auth[Authentication]
        Cache[Redis Cache]
    end

    subgraph Blockchain
        SC[Smart Contracts]
        IPFS[IPFS Storage]
        Events[Event Listeners]
    end

    UI --> WC
    UI --> AI
    WC --> API
    AI --> API
    API --> Auth
    API --> Cache
    API --> SC
    SC --> IPFS
    SC --> Events
    Events --> API
```

## Workflow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API
    participant AI as AI Service
    participant BC as Blockchain
    participant IPFS as IPFS Storage

    User->>UI: Connect Wallet
    UI->>API: Authenticate
    API-->>UI: Session Token

    User->>UI: Enter Birth Details
    UI->>AI: Generate Fortune
    AI-->>UI: Fortune Prediction

    User->>UI: Mint NFT
    UI->>API: Prepare Metadata
    API->>IPFS: Store Metadata
    IPFS-->>API: IPFS Hash
    API->>BC: Mint NFT
    BC-->>UI: NFT Minted
    UI-->>User: Display NFT

    User->>UI: View Fortune
    UI->>BC: Fetch NFT Data
    BC-->>UI: Token URI
    UI->>IPFS: Fetch Metadata
    IPFS-->>UI: Card Details
    UI-->>User: Display Card
```

## Project Structure

```
zodiac-card/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── pages/            # App pages
├── ZodiacCardContracts/   # Smart contract monorepo
│   ├── packages/         
│   │   └── hardhat/      # Hardhat development environment
│   │       ├── contracts/     # Smart contract source files
│   │       ├── deploy/        # Deployment scripts
│   │       ├── test/         # Contract test files
│   │       └── scripts/      # Utility scripts
│   └── README.md         # Smart contract documentation
├── lib/                  # Utility functions
├── public/              # Static assets
└── styles/              # Global styles
```

## Smart Contracts

The smart contracts for Zodiac Card are organized in a monorepo structure under `ZodiacCardContracts/`. This setup allows for better organization and separation of concerns between the frontend application and blockchain components.

### Contract Architecture

The smart contracts are developed using Hardhat and include:

- NFT contract for minting Zodiac Fortune Cards
- Integration with IPFS for storing card metadata
- Event emission for frontend updates
- Secure ownership and access control mechanisms

### Development Environment

The contracts are set up with a robust development environment including:

- Hardhat for development, testing, and deployment
- TypeScript support for type-safe development
- Automated testing setup
- Deployment scripts for multiple networks
- Environment variable configuration
- Code quality tools (ESLint, Prettier)

### Getting Started with Contracts

1. Navigate to the contracts directory
```bash
cd ZodiacCardContracts/packages/hardhat
```

2. Install dependencies
```bash
yarn install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Compile contracts
```bash
yarn compile
```

5. Run tests
```bash
yarn test
```

6. Deploy contracts
```bash
yarn deploy --network <network-name>
```

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/zodiac-card.git
cd zodiac-card
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Run the development server
```bash
pnpm dev
```

5. Deploy smart contracts (coming soon)
```bash
pnpm hardhat deploy --network <network>
```

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Website: [zodiaccard.xyz](https://zodiaccard.xyz)
- Twitter: [@ZodiacCardNFT](https://twitter.com/ZodiacCardNFT)
- Discord: [Join our community](https://discord.gg/zodiaccard)
- Farcaster Mini App Documentation: [miniapps.farcaster.xyz](https://miniapps.farcaster.xyz/)
