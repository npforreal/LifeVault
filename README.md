# NOTE: THIS IS A PERSONAL PROJECT AND STILL WORKING ON.

# LifeVault

LifeVault is a secure digital data and connected account lifecycle manager. The project combines a privacy-first vault, encrypted lifecycle controls, and official-account automation hooks in a clean, production-oriented architecture.

## Features
- Secure vault for notes, passwords, documents, media, recovery codes, and custom records
- Independent expiration and destruction controls with cryptographic erasure semantics
- OAuth-ready connected account management using official APIs only
- Reusable deletion plans and scheduled lifecycle actions
- Audit logging, backup/restore scaffolding, and a modern dashboard

## Structure
- backend: Express + TypeScript + Prisma + JWT + encryption helpers
- frontend: React + TypeScript + Vite + Tailwind-style UI shell
- prisma: PostgreSQL schema and data model
- docs: architecture, encryption, OAuth flow, deployment, and API notes

## Quick start
1. Create a PostgreSQL database named lifevault.
2. Copy backend/.env.example to backend/.env and update the values.
3. Run `npx prisma migrate dev --name init` from the repository root.
4. Start everything with `npm run dev` from the repository root.
5. Open the UI at `http://localhost:5173/`.

## What is included
- Authentication and secure session handling
- Encrypted vault item creation with previews and destroy actions
- Deletion plans and connected-account scaffolding
- Backup and restore with encrypted bundles
- Lifecycle notifications and scheduler hooks
- Automated regression tests and production builds
