#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ExternalResources } from '../lib/external';
import { OracleStack } from '../lib/oracle';
import { ReplicationStack } from '../lib/migration';

const account = process.env.CDK_DEPLOY_ACCOUNT
const region = process.env.CDK_DEPLOY_REGION

const app = new cdk.App();

const externalResources = new ExternalResources(app, 'ExternalResources', {
  env: {
    account: account,
    region: region
  },
  vpcId: app.node.tryGetContext('vpcId')
});

const oracleStack = new OracleStack(app, 'OracleStack', {
  env: {
    account: account,
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
    account: account,
    region: region
  },
  tags: {
    Owner: 'antoine',
    Environment: 'test',
    Project: 'oracle-dms'
  },
  database: oracleStack.database,
  dmsPassword: app.node.tryGetContext('dmsPassword'),
  dmsUser: app.node.tryGetContext('dmsUser'),
  securityGroup: oracleStack.replicationSecurityGroup,
  vpc: externalResources.vpc
});
