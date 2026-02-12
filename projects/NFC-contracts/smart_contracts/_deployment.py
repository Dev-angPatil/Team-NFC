from __future__ import annotations

import json
import os
from pathlib import Path


def _update_env_file(path: Path, key: str, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        lines = path.read_text(encoding="utf-8").splitlines()
    else:
        lines = []

    updated = False
    output: list[str] = []
    for line in lines:
        if line.startswith(f"{key}="):
            output.append(f"{key}={value}")
            updated = True
        else:
            output.append(line)

    if not updated:
        output.append(f"{key}={value}")

    path.write_text("\n".join(output) + "\n", encoding="utf-8")


def persist_app_id(contract_key: str, app_id: int) -> None:
    project_root = Path(__file__).resolve().parents[2]
    frontend_env_local = project_root.parent / "NFC-frontend" / ".env.local"
    env_key = f"VITE_{contract_key.upper()}_APP_ID"
    _update_env_file(frontend_env_local, env_key, str(app_id))

    network = os.getenv("ALGOD_NETWORK", "testnet").strip().lower() or "testnet"
    deployment_dir = project_root / "smart_contracts" / "deployments"
    deployment_dir.mkdir(parents=True, exist_ok=True)
    deployment_file = deployment_dir / f"{network}.json"

    data: dict[str, int]
    if deployment_file.exists():
        data = json.loads(deployment_file.read_text(encoding="utf-8"))
    else:
        data = {}

    data[f"{contract_key}_app_id"] = int(app_id)
    deployment_file.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
