DOCKER_IMAGE=oracle-alembic

deploy:
	cdk deploy $(STACK) \
		-c vpcId=$(VPC_ID) \
		-c subnetIds=$(SUBNET_IDS) \
		-c availabilityZones=$(AVAILABILITY_ZONES) \
		-c myIp=$(MY_IP)

build:
	docker build -t $(DOCKER_IMAGE) migrations

db-setup: build
	docker run --rm $(DOCKER_IMAGE) alembic upgrade head

db-rollback: build
	docker run --rm $(DOCKER_IMAGE) alembic downgrade base

login:
	docker run -ti --rm store/oracle/database-instantclient:12.2.0.1 \
		sqlplus '$(USER)@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=$(HOST))(PORT=1521))(CONNECT_DATA=(SID=ORCL)))'
