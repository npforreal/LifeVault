# OAuth Flow

1. The user selects a supported provider.
2. The application redirects the user to the provider's official authorization endpoint.
3. The provider returns an authorization code.
4. The backend exchanges the code for a token via the provider's official API.
5. The access and refresh tokens are stored only in encrypted form.
6. The user can later revoke access through the provider or the application's supported account controls.

The design intentionally avoids unofficial automation or browser-driven scraping that could violate platform terms.
