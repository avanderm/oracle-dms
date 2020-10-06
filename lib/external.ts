import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

interface ExternalResourcesProps extends cdk.StackProps {
  vpcId: string;
}

export class ExternalResources extends cdk.Stack {
  public readonly vpc: ec2.IVpc;

  constructor(scope: cdk.Construct, id: string, props: ExternalResourcesProps) {
    super(scope, id, props);

    this.vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      vpcId: props.vpcId
    });
  }
}
