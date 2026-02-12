from algopy import ARC4Contract, Bytes, LocalState, Txn, arc4
from algopy.arc4 import abimethod, baremethod


class Identity(ARC4Contract):
    def __init__(self) -> None:
        self.student_hash = LocalState(Bytes, key="student_hash")

    @baremethod(allow_actions=["OptIn"])
    def opt_in(self) -> None:
        self.student_hash[Txn.sender] = Bytes()

    @abimethod()
    def register(self, student_hash: arc4.String) -> None:
        self.student_hash[Txn.sender] = student_hash.bytes

    @abimethod(readonly=True)
    def get_registered_hash(self, account: arc4.Address) -> arc4.String:
        student_hash = self.student_hash.get(account.native, Bytes())
        return arc4.String.from_bytes(student_hash)
