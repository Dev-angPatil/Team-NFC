import logging

import algokit_utils

from smart_contracts._deployment import persist_app_id

logger = logging.getLogger(__name__)


def deploy() -> None:
    from smart_contracts.artifacts.identity.identity_client import IdentityFactory

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        IdentityFactory,
        default_sender=deployer.address,
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    persist_app_id("identity", app_client.app_id)
    logger.info(
        "Identity app deployment operation=%s app_id=%s",
        result.operation_performed,
        app_client.app_id,
    )
