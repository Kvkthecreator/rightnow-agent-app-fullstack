/**
 * OAuth request/response types (RFC 6749)
 */

export interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  state: string;
  scope?: string;
}

export interface TokenRequest {
  grant_type: string;
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret?: string;
  scope?: string;
}
