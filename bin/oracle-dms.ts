#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ExternalResources } from '../lib/external';
import { OracleStack } from '../lib/oracle';
import { ReplicationStack } from '../lib/migration';

const region = process.env.CDK_DEPLOY_REGION

const app = new cdk.App();

const externalResources = new ExternalResources(app, 'ExternalResources', {
  vpcId: app.node.tryGetContext('vpcId'),
  subnetIds: app.node.tryGetContext('subnetIds')?.split(','),
  availabilityZones: app.node.tryGetContext('availabilityZones')?.split(',')
});

const oracleStack = new OracleStack(app, 'OracleStack', {
  env: {
    region: region
  },
  tags: {
    Owner: 'antoine',
    Environment: 'test',
    Project: 'oracle-dms'
  },
  vpc: externalResources.vpc,
  ip: app.node.tryGetContext('myIp')
});

new ReplicationStack(app, 'ReplicationStack', {
  env: {
    region: region
  },
  tags: {
    Owner: 'antoine',
    Environment: 'test',
    Project: 'oracle-dms'
  },
  database: oracleStack.database,
  password: 'password',
  securityGroup: oracleStack.replicationSecurityGroup,
  vpc: externalResources.vpc
});
