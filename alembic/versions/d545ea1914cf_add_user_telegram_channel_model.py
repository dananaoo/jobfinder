"""add user telegram channel model

Revision ID: d545ea1914cf
Revises: b1ad45b0ac56
Create Date: 2025-06-26 12:31:01.091500

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd545ea1914cf'
down_revision: Union[str, None] = 'b1ad45b0ac56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('job_posts', sa.Column('industry', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('job_posts', 'industry')
    # ### end Alembic commands ###
