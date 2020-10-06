FROM store/oracle/database-instantclient:12.2.0.1

WORKDIR /opt

RUN yum install -y python3
RUN pip3 install alembic cx-Oracle boto3

COPY alembic alembic
COPY alembic.ini alembic.ini
