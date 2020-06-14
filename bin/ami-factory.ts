#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AmiFactoryStack } from '../lib/ami-factory-stack';

const app = new cdk.App();
new AmiFactoryStack(app, 'AmiFactoryStack');
