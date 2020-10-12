# Oracle to S3 (Parquet) DMS

This repository contains infrastructure as code to setup a database migration service, loading full tables from an Oracle RDS database and sinking them in S3 in Parquet format. The ongoing changes after the full load are captured as well and sinked. This demo illustrates the use of CDK and setting up an Oracle database for DMS. For application in a production environment where performance, security and monitoring are key, see the [DMS Best Practices](https://d1.awsstatic.com/whitepapers/RDS/AWS_Database_Migration_Service_Best_Practices.pdf) white paper and adjust accordingly.

## 1. Setting up the Database Stack

The database stack is deployed using CDK and will require a VPC id. To deploy use

```bash
STACK=OracleStack make deploy
```

**Set values for the environment variables `CDK_DEPLOY_ACCOUNT`, `CDK_DEPLOY_REGION` and `VPC_ID`.**

In addition to the database, ingress rules are applied for your personal IP and for a security group used later to run the DMS replicating instance in. If you want to run the database in private subnets, you can do so [here](https://github.com/avanderm/oracle-dms/blob/74f7b4943415ea4951be57cf213e817629874e1d/lib/oracle.ts#L40).

## 2. Running Database Migrations

We provide some migrations to populate the database. Retrieve the secret accompanying the database, created in the previous step, in AWS Secrets Manager. Reuse the deployment region.

```bash
CDK_DEPLOY_REGION=... SECRET_ID=... make db-upgrade
```

You can now double check the presence of the `users` table in the `ADMIN` schema.

```bash
USER=admin HOST=... make login
```

The `HOST` environment variable is the endpoint address of the Oracle RDS instance. Or if you deployed in private subnets and have a bastion server available, use a SSH tunnel.

## 3. Preparing the Oracle Database

Follow the steps to enable supplemental logging and create the directories for the Binary Reader as explained [here](https://aws.amazon.com/blogs/database/effectively-migrating-lob-data-to-amazon-s3-from-amazon-rds-for-oracle-with-aws-dms/). In addition, create the DMS user with the necessary privileges.

## 4. Setting up the DMS stack

Now deploy the DMS stack using

```bash
STACK=ReplicationStack make deploy
```

**Set values for the environment variables `CDK_DEPLOY_ACCOUNT`, `CDK_DEPLOY_REGION` and `VPC_ID`. In addition, use the values you set in the previous step for `DMS_USER` and `DMS_PASSWORD`.**

If you wish to deploy in private subnets, change so [here](https://github.com/avanderm/oracle-dms/blob/master/lib/migration.ts#L51).

If everything is deployed fine, the connection tests for all the endpoint will pass and you can kick off the database migration task in DMS. The Parquet files will appear in S3, of which the content and types can be checked with a tool such as `parq`. Running a Glue crawler on the bucket will populate a Glue database with the tables where you can check the data types.

Inserting data into the existing tables will be captured by the CDC process of DMS. Unlike the full load files, these will include an additional column called `Op` which indicates whether the record is the result of an insert (I), update (U) or delete (D). A Glue database and crawler are made available.
