DOCKER_IMAGE=oracle-alembic

MY_IP=$(shell dig @resolver1.opendns.com ANY myip.opendns.com +short)

deploy:
	cdk deploy $(STACK) \
		-c dmsPassword=$(DMS_PASSWORD) \
		-c dmsUser=$(DMS_USER) \
		-c myIp=$(MY_IP) \
		-c vpcId=$(VPC_ID)

build:
	docker build -t $(DOCKER_IMAGE) migrations

db-upgrade: build
	docker run \
		-v $(HOME)/.aws/credentials:/root/.aws/credentials:ro \
		-e SECRET_ID=$(SECRET_ID) \
		-e AWS_DEFAULT_REGION=$(CDK_DEPLOY_REGION) \
		--rm $(DOCKER_IMAGE) alembic upgrade head

db-downgrade: build
	docker run \
		-v $(HOME)/.aws/credentials:/root/.aws/credentials:ro \
		-e SECRET_ID=$(SECRET_ID) \
		-e AWS_DEFAULT_REGION=$(CDK_DEPLOY_REGION) \
		--rm $(DOCKER_IMAGE) alembic downgrade base

login:
	docker run -ti --rm store/oracle/database-instantclient:12.2.0.1 \
		sqlplus '$(USER)@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=$(HOST))(PORT=1521))(CONNECT_DATA=(SID=ORCL)))'
