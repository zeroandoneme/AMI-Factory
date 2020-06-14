import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect, Policy, Group } from '@aws-cdk/aws-iam';
import * as apigw from '@aws-cdk/aws-apigateway';

import { Duration } from '@aws-cdk/core';
import { AuthorizationType, LambdaIntegration } from '@aws-cdk/aws-apigateway';
export class AmiFactoryStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const asgConfiguration = new lambda.Function(this, 'asg-configuration', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'asg-configuration.handler',
      timeout: Duration.seconds(10)
    });

    const asgFullAccessPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['autoscaling:*'],
      resources: ['*']
    });

    const elbDescirbePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTargetGroups"
      ],
      resources: ['*']
    });

    const ec2Policy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "ec2:DescribeAccountAttributes",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeImages",
        "ec2:DescribeInstanceAttribute",
        "ec2:DescribeInstances",
        "ec2:DescribeKeyPairs",
        "ec2:DescribeLaunchTemplateVersions",
        "ec2:DescribePlacementGroups",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSpotInstanceRequests",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcClassicLink",
        "ec2:CreateImage"
      ],
      resources: ['*']
    });


    const iamPassPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["iam:PassRole"],
      resources: ["*"]
    });

    asgConfiguration.addToRolePolicy(asgFullAccessPolicy);
    asgConfiguration.addToRolePolicy(elbDescirbePolicy);
    asgConfiguration.addToRolePolicy(ec2Policy);
    asgConfiguration.addToRolePolicy(iamPassPolicy);

    // defines an API Gateway REST API resource backed by our "hello" function.
    
    const api = new apigw.RestApi( this, 'AMI-Factory', { });
    const integration = new LambdaIntegration(asgConfiguration);

    const postMethod = api.root.addMethod('Post', integration, {
      authorizationType: AuthorizationType.IAM
    });

    //Group to add users to 
    const iamGroup = new Group(this, 'AMI-Factory-Group');

    //this policy should be attached to the IAM user
    const policy = new Policy(this, 'AMI-Factory-Policy', {
      statements: [
        new PolicyStatement({
          actions: [ 'execute-api:Invoke' ],
          effect: Effect.ALLOW,
          resources: [ postMethod.methodArn ]
        })
      ]
    });

    policy.attachToGroup(iamGroup);
    
  }
}
