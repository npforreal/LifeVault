# Architecture Overview

LifeVault uses a layered clean architecture approach:

- Controllers: HTTP route handling and request validation
- Services: business logic for vault lifecycle, auth, and deletion plan execution
- Repositories: persistence access for Prisma entities
- Crypto: encryption, key handling, and cryptographic erasure helpers
- Scheduler: background processing for expiration, destruction, and connected-account actions
- Middleware: auth, validation, rate limiting, and security hardening

This structure keeps domain logic independent from transport and database concerns and makes the project easier to scale and test.
