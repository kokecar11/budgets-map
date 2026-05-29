"""move budget item link from budget_items.transaction_id to transactions.budget_item_id

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'transactions',
        sa.Column(
            'budget_item_id',
            sa.String,
            sa.ForeignKey('budget_items.id', ondelete='SET NULL'),
            nullable=True,
        )
    )
    op.execute(
        "UPDATE transactions SET budget_item_id = bi.id "
        "FROM budget_items bi "
        "WHERE bi.transaction_id = transactions.id"
    )
    op.drop_column('budget_items', 'transaction_id')


def downgrade() -> None:
    op.add_column(
        'budget_items',
        sa.Column('transaction_id', sa.String, sa.ForeignKey('transactions.id'), nullable=True)
    )
    op.execute(
        "UPDATE budget_items bi SET transaction_id = t.id "
        "FROM transactions t "
        "WHERE t.budget_item_id = bi.id"
    )
    op.drop_column('transactions', 'budget_item_id')
