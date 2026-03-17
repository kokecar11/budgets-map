"""add subscription fields to users

Revision ID: f1a2b3c4d5e6
Revises: 6ae3344d4f36
Create Date: 2026-03-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = '6ae3344d4f36'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('plan', sa.String(), nullable=False, server_default='free'))
    op.add_column('users', sa.Column('lemon_squeezy_customer_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('lemon_squeezy_subscription_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('subscription_status', sa.String(), nullable=True))
    op.add_column('users', sa.Column('subscription_ends_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'subscription_ends_at')
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'lemon_squeezy_subscription_id')
    op.drop_column('users', 'lemon_squeezy_customer_id')
    op.drop_column('users', 'plan')
