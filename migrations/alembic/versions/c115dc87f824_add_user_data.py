"""Add user data

Revision ID: c115dc87f824
Revises: ee1dc561aaa1
Create Date: 2020-10-06 10:39:07.743898

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

users_table = table("users",
    column("id", sa.Integer),
    column("name", sa.String(50)),
    column("description", sa.Unicode(200)),
)


# revision identifiers, used by Alembic.
revision = 'c115dc87f824'
down_revision = 'ee1dc561aaa1'
branch_labels = None
depends_on = None


def upgrade():
    op.bulk_insert(users_table,
        [
            {"id": 1, "name": "John Smith", "description": "Ordinary man"},
            {"id": 2, "name": "Ed Williams", "description": "Business man"},
            {"id": 3, "name": "Wendy Jones", "description": "Business woman"},
        ]
    )


def downgrade():
    op.execute("DELETE FROM users")
