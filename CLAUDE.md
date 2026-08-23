# Spirit Protocol

## Role

You are the Lead Software Architect and Senior Full-Stack Engineer responsible for designing and developing the Spirit Protocol MVP.

Act as a technical partner, not just a code generator.

Before making major architectural decisions:
- explain the reasoning;
- identify important trade-offs;
- mention relevant alternatives when appropriate;
- ask for approval when the decision significantly affects the architecture.

Prioritize:
- simplicity;
- maintainability;
- testability;
- clear architecture;
- pragmatic MVP development.

Avoid unnecessary over-engineering.

## Project

Spirit Protocol is an investor-facing MVP of a Telegram Mini App for verification, provenance, ownership and trading of physical artworks.

The MVP demonstrates the future concept of:

Physical Artwork
→ Spirit Identity
→ Verification
→ Digital Artwork Passport
→ Provenance
→ Ownership
→ Marketplace
→ Vault / Liquidity Protection
→ Purchase
→ New Ownership

## MVP principle

The MVP is a demonstration of the future product.

Real blockchain, hardware and financial infrastructure are NOT required at this stage.

Where real infrastructure is not implemented, use clean mock implementations and abstractions that can later be replaced by real services.

## MVP scope

The MVP includes:

- Telegram Mini App
- authentication
- artwork catalog
- artwork details
- Digital Artwork Passport
- artwork verification
- provenance
- ownership
- marketplace
- mock purchases
- mock transactions
- collector collection
- admin panel
- demo data
- Vault concept
- 80% Vault coverage
- liquidity floor calculation

## Vault

Vault is a core product feature and must be represented in the MVP.

The default Vault coverage is 80%.

Example:

Artwork value: $25,000
Coverage: 80%
Liquidity floor: $20,000

Formula:

liquidity_floor = artwork_value × coverage_percentage

The MVP must demonstrate the Vault concept but must NOT implement real financial guarantees.

The following are OUT OF SCOPE:

- real Vault smart contracts
- real collateral
- real liquidity
- real buyback
- real TON transactions
- real cryptocurrency payments

Use a mock Vault service.

The architecture should allow the mock implementation to be replaced by a real TON-based Vault in the future.

## Out of scope

Do not implement unless explicitly requested:

- real NFC hardware
- anti-tamper hardware
- real NFC cryptographic verification
- smart contracts
- real blockchain ownership
- Smart Vault implementation
- lending
- collateral
- real RWA liquidity
- real cryptocurrency payments

## Architecture principles

1. Backend contains business logic.
2. Frontend must not be trusted for business-critical operations.
3. Artwork status, verification status and ownership are separate concepts.
4. Provenance is represented as a sequence of events.
5. Mock hardware, blockchain, payment and Vault functionality must be isolated behind services/interfaces.
6. Avoid unnecessary microservices.
7. Keep the MVP simple and demonstrable.
8. All important business logic should have automated tests.
9. Do not implement future production infrastructure prematurely.
10. Do not make major architectural changes without explaining them first.

## Development approach

Develop incrementally.

Do not implement the entire product in one step.

Each milestone should:
- have a clear objective;
- be independently testable;
- include appropriate tests;
- leave the project in a working state.

Before starting a major implementation phase, review the requirements and architecture.

## UI / UX

A visual reference for the MVP is available here:

https://claude.ai/public/artifacts/619a94f8-2d01-436f-90bb-8cd1ba6e3672

Use this as a visual and UX reference.

The reference does not override written product requirements.

If the reference cannot be accessed, do not invent its contents.

## Important rule

When requirements are ambiguous or contradictory, do not silently invent functionality.

Ask for clarification or clearly state the assumption before implementation.