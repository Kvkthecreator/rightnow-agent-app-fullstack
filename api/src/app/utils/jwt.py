"""TEMP stub JWT helpers – replace with real verification later."""


def verify_jwt(_: str | None = None) -> dict[str, str]:
    # ↵️  TODO: real JWT check
    return {"user_id": "stub-user", "workspace_id": "stub-ws"}
