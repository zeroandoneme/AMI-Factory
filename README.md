# Welcome to AMI-Factory project!

This project is intended to be used to ease the creation of AMI and updating Launch Configuration in AWS.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Output

After running `cdk deploy` project will create

- Lambda function that is responsible for :
  - Create AMI Image
  - Check loadbalancer active launch Configuration
  - Get new Image snapshot ID
  - Create new Launch Configuration with update AMI and snaphost
  - Update LoadBalancer to with new Launch Configuration
- API Gateway
  - Will take two parameters (Instance-id, AutoScallingGroupName)
  - Secured by `iam-aws`
- IAM User Group
  - Users in this group will have permission to invoke the API Gateway 

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


