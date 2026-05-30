"""create financial_rules table

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-05-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, Sequence[str], None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'financial_rules',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('expense_model', sa.String(), server_default='accrual', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index(op.f('ix_financial_rules_id'), 'financial_rules', ['id'], unique=False)
    op.create_index(op.f('ix_financial_rules_user_id'), 'financial_rules', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_financial_rules_user_id'), table_name='financial_rules')
    op.drop_index(op.f('ix_financial_rules_id'), table_name='financial_rules')
    op.drop_table('financial_rules')
