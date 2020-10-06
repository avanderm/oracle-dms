import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
//import * as sm from '@aws-cdk/aws-secretsmanager';

interface OracleStackProps extends cdk.StackProps {
  ip: string;
  vpc: ec2.IVpc;
}

export class OracleStack extends cdk.Stack {
  //public readonly secret: sm.ISecret;
  public readonly database: rds.IDatabaseInstance;
  public readonly replicationSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: cdk.Construct, id: string, props: OracleStackProps) {
    super(scope, id, props);

    const replicationSecurityGroup = new ec2.SecurityGroup(this, 'ReplicationSecurityGroup', {
      vpc: props.vpc
    });

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc
    });

    securityGroup.addIngressRule(ec2.Peer.ipv4(`${props.ip}/32`), ec2.Port.tcp(1521), 'Oracle Ingress');
    securityGroup.connections.allowFrom(replicationSecurityGroup, ec2.Port.tcp(1521), 'DMS Ingress');

    const instance = new rds.DatabaseInstance(this, 'Instance', {
      engine: rds.DatabaseInstanceEngine.oracleSe2({
        version: rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
      licenseModel: rds.LicenseModel.LICENSE_INCLUDED,
      credentials: rds.Credentials.fromUsername('admin'),
      securityGroups: [securityGroup],
      vpc: props.vpc,
      vpcSubnets: {
        //subnetType: ec2.SubnetType.PRIVATE
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    //this.secret = instance.secret!;
    this.database = instance;
    this.replicationSecurityGroup = replicationSecurityGroup;
  }
}
