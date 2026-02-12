from algopy import ARC4Contract, BoxMap, Bytes, Txn, UInt64, arc4, op
from algopy.arc4 import abimethod


class Permission(ARC4Contract):
    def __init__(self) -> None:
        self.permission_expiry = BoxMap(Bytes, UInt64, key_prefix=b"perm_")

    @abimethod()
    def grant(self, account: arc4.Address, expiry_timestamp: arc4.UInt64) -> None:
        assert Txn.sender == op.Global.creator_address
        self.permission_expiry[account.bytes] = expiry_timestamp.native

    @abimethod()
    def revoke(self, account: arc4.Address) -> None:
        assert Txn.sender == op.Global.creator_address
        del self.permission_expiry[account.bytes]

    @abimethod(readonly=True)
    def has_permission(self, account: arc4.Address) -> arc4.Bool:
        expiry_timestamp = self.permission_expiry.get(
            account.bytes, default=UInt64(0)
        )
        return arc4.Bool(expiry_timestamp >= op.Global.latest_timestamp)
