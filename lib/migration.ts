import * as cdk from '@aws-cdk/core';
import * as dms from '@aws-cdk/aws-dms';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as rds from '@aws-cdk/aws-rds';
import * as s3 from '@aws-cdk/aws-s3';
import * as sm from '@aws-cdk/aws-secretsmanager';
import * as fs from 'fs';

interface ReplicationStackProps extends cdk.StackProps {
  database: rds.IDatabaseInstance;
  dmsPassword: string;
  dmsUser: string;
  securityGroup: ec2.ISecurityGroup;
  vpc: ec2.IVpc;
}

export class ReplicationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ReplicationStackProps) {
    super(scope, id, props);

    const replicationBucket = new s3.Bucket(this, 'Bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const targetPermissions = new iam.PolicyStatement();
    targetPermissions.addResources(replicationBucket.bucketArn);
    targetPermissions.addActions('s3:ListBucket');

    const targetObjectPermissions = new iam.PolicyStatement();
    targetObjectPermissions.addResources(`${replicationBucket.bucketArn}/*`);
    targetObjectPermissions.addActions(
      's3:DeleteObject',
      's3:PutObject'
    );

    const replicationTargetRole = new iam.Role(this, 'S3TargetDMSRole', {
      assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
      inlinePolicies: {
        'root': new iam.PolicyDocument({
          statements: [
            targetPermissions,
            targetObjectPermissions
          ]
        })
      }
    });

    const replicationSubnetGroup = new dms.CfnReplicationSubnetGroup(this, 'SubnetGroup', {
      replicationSubnetGroupDescription: 'Subnets available for DMS',
      subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId)
    });

    const replicationInstance = new dms.CfnReplicationInstance(this, 'Instance', {
      availabilityZone: props.vpc.availabilityZones[0],
      publiclyAccessible: false,
      replicationInstanceClass: 'dms.t2.small',
      replicationSubnetGroupIdentifier: replicationSubnetGroup.ref,
      vpcSecurityGroupIds: [props.securityGroup.securityGroupId]
    });

    const oracleSourceEndpoint = new dms.CfnEndpoint(this, 'Source', {
      databaseName: 'ORCL',
      endpointType: 'source',
      engineName: 'ORACLE',
      password: props.dmsPassword,
      //port: parseInt(props.database.dbInstanceEndpointPort),
      port: 1521,
      serverName: props.database.dbInstanceEndpointAddress,
      username: props.dmsUser,
      extraConnectionAttributes: 'useLogminerReader=N;useBfile=Y;accessAlternateDirectly=false;useAlternateFolderForOnline=true; oraclePathPrefix=/rdsdbdata/db/ORCL_A/;usePathPrefix=/rdsdbdata/log/;replacePathPrefix=true'
    });

    const s3TargetEndpoint = new dms.CfnEndpoint(this, 'Target', {
      endpointType: 'target',
      engineName: 'S3',
      extraConnectionAttributes: 'addColumnName=true;dataFormat=parquet;parquetVersion=PARQUET_2_0',
      s3Settings: {
        bucketName: replicationBucket.bucketName,
        serviceAccessRoleArn: replicationTargetRole.roleArn
      }
    });

    const replicationTask = new dms.CfnReplicationTask(this, 'Task', {
      migrationType: 'full-load-and-cdc',
      replicationInstanceArn: replicationInstance.ref,
      replicationTaskSettings: fs.readFileSync('config/replication-task-settings.json', 'utf-8'),
      sourceEndpointArn: oracleSourceEndpoint.ref,
      tableMappings: fs.readFileSync('config/table-mappings.json', 'utf-8'),
      targetEndpointArn: s3TargetEndpoint.ref
    });
  }
}
