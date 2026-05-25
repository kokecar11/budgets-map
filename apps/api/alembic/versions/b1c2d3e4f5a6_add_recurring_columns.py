"""add recurrence_day_of_month and parent_transaction_id to transactions

Revision ID: b1c2d3e4f5a6
Revises: a922ce3ebe51
Create Date: 2026-05-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = 'a922ce3ebe51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('transactions', sa.Column('recurrence_day_of_month', sa.Integer(), nullable=True))
    op.add_column('transactions', sa.Column('parent_transaction_id', sa.String(), nullable=True))
    op.create_foreign_key(
        'fk_transactions_parent_id', 'transactions',
        'transactions', ['parent_transaction_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_transactions_parent_transaction_id', 'transactions', ['parent_transaction_id'])
    op.execute(
        "UPDATE transactions SET recurrence_day_of_month = EXTRACT(DAY FROM date)::INTEGER "
        "WHERE is_recurring = TRUE AND recurrence = 'monthly'"
    )


def downgrade() -> None:
    op.drop_index('ix_transactions_parent_transaction_id', table_name='transactions')
    op.drop_constraint('fk_transactions_parent_id', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'parent_transaction_id')
    op.drop_column('transactions', 'recurrence_day_of_month')
