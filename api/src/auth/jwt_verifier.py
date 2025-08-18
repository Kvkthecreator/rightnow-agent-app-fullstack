def verify_jwt(token: str) -> dict:
    """Verify a Supabase JWT and return its payload."""
    header = jwt.get_unverified_header(token)
    alg = (header.get("alg") or "").upper()
    
    # DEBUG
    payload_unverified = jwt.decode(token, options={"verify_signature": False})
    print(f"VERIFY JWT DEBUG:", file=sys.stderr)
    print(f"  Algorithm: {alg}", file=sys.stderr)
    print(f"  Token ISS: {payload_unverified.get('iss')}", file=sys.stderr)
    print(f"  Token AUD: {payload_unverified.get('aud')}", file=sys.stderr)
    print(f"  Expected ISS: {ISSUER}", file=sys.stderr)
    print(f"  Expected AUD: {AUD}", file=sys.stderr)
    
    if alg == "HS256":
        if not JWT_SECRET:
            raise RuntimeError("SUPABASE_JWT_SECRET missing for HS256 verification")
        
        try:
            result = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"],
                audience=AUD,
                issuer=ISSUER,
                options=_opts,
                leeway=LEEWAY,
            )
            print(f"  ✅ JWT verification successful!", file=sys.stderr)
            return result
        except jwt.ExpiredSignatureError as e:
            print(f"  ❌ Token expired: {e}", file=sys.stderr)
            raise
        except jwt.InvalidAudienceError as e:
            print(f"  ❌ Invalid audience: {e}", file=sys.stderr)
            raise
        except jwt.InvalidIssuerError as e:
            print(f"  ❌ Invalid issuer: {e}", file=sys.stderr)
            raise
        except jwt.InvalidSignatureError as e:
            print(f"  ❌ Invalid signature: {e}", file=sys.stderr)
            raise
        except Exception as e:
            print(f"  ❌ JWT verification failed: {type(e).__name__}: {e}", file=sys.stderr)
            raise