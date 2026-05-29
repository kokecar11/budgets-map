"""add credit_card_transaction_id to transactions and make account_id nullable

Revision ID: c1d2e3f4a5b6
Revises: ('f1a2b3c4d5e6', 'b1c2d3e4f5a6')
Create Date: 2026-05-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = ('f1a2b3c4d5e6', 'b1c2d3e4f5a6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('transactions', 'account_id', nullable=True)
    op.add_column('transactions', sa.Column(
        'credit_card_transaction_id', sa.String(), nullable=True
    ))
    op.create_foreign_key(
        'fk_transactions_cc_transaction_id', 'transactions',
        'credit_card_transactions', ['credit_card_transaction_id'], ['id']
    )
    op.drop_constraint('chk_transaction_single_reference', 'transactions', type_='check')
    op.create_check_constraint(
        'chk_transaction_single_reference', 'transactions',
        "(CASE WHEN transfer_to_account_id IS NOT NULL THEN 1 ELSE 0 END) + "
        "(CASE WHEN credit_card_payment_id IS NOT NULL THEN 1 ELSE 0 END) + "
        "(CASE WHEN loan_payment_id IS NOT NULL THEN 1 ELSE 0 END) + "
        "(CASE WHEN saving_goal_id IS NOT NULL THEN 1 ELSE 0 END) + "
        "(CASE WHEN credit_card_transaction_id IS NOT NULL THEN 1 ELSE 0 END) <= 1"
    )


def downgrade() -> None:
    op.execute("DELETE FROM transactions WHERE type = 'credit_card_charge'")
    op.drop_constraint('chk_transaction_single_reference', 'transactions', type_='check')
    op.create_check_constraint(
        'chk_transaction_single_reference', 'transactions',
        "(CASE WHEN transfer_to_account_id IS NOT NULL THEN 1 ELSE 0 END) + "
        "(CASE WHEN credit_card_payment_id IS NOT NULL THEN 1 ELSE 0 END) + "
        "(CASE WHEN loan_payment_id IS NOT NULL THEN 1 ELSE 0 END) + "
        "(CASE WHEN saving_goal_id IS NOT NULL THEN 1 ELSE 0 END) <= 1"
    )
    op.drop_constraint('fk_transactions_cc_transaction_id', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'credit_card_transaction_id')
    op.alter_column('transactions', 'account_id', nullable=False)
