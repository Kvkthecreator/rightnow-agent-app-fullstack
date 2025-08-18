# Yarnnn Frontend Auth

This document tracks how the web client attaches the user's session token to every API request.

## Token requirement

All calls to the FastAPI backend must include the Supabase access token in both the `sb-access-token` and `Authorization` headers. The helper `fetchWithToken` throws an error when the token is missing. Pages should redirect the user to `/login` when this occurs.

## Utilities

- **fetchWithToken** – wraps `fetch` and ensures the token is present.
- **apiGet/apiPost/apiPut** – thin wrappers that delegate to `fetchWithToken`.

## Handling failures

If `fetchWithToken` throws, the caller should assume the user is signed out. Redirect to `/login` or surface a message prompting them to reauthenticate.
