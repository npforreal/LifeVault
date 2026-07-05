# Encryption Design

LifeVault uses an independently encrypted payload model for each vault item.

- Each item gets a random IV and a random data encryption key.
- The item payload is encrypted using AES-256-GCM.
- Authentication tags prevent tampering.
- The encryption key is never stored in plaintext alongside the payload.
- Destruction removes the encrypted payload and associated key material, making recovery cryptographically infeasible.

The current implementation uses the Node.js crypto module to demonstrate the intended approach and is designed to be upgraded to Argon2id/HKDF-based key derivation in a production deployment.
