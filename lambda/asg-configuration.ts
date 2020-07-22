import { EC2, AutoScaling , } from 'aws-sdk'; 
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DescribeImagesRequest, CreateImageRequest } from 'aws-sdk/clients/ec2';
import { LaunchConfigurationNamesType, AutoScalingGroupNamesType, CreateLaunchConfigurationType, UpdateAutoScalingGroupType, BlockDeviceMappings } from 'aws-sdk/clients/autoscaling';

interface apiRequestInterface {
    asgName: string,
    instanceId: string,
    amiName?: string
}


export const handler: APIGatewayProxyHandler = async (event) => {

    console.log("request:", JSON.stringify(event, undefined, 2));

    const autoscaling = new AutoScaling();
    const ec2 = new EC2();

    let runDate = new Date().toISOString().substring(0, 19).replace(':','-').replace(':','-');
    console.log('Run Date: ' + runDate);

    const apiRequest: apiRequestInterface = JSON.parse(event.body!);

    const ec2ImageParams: CreateImageRequest = {
        Description: "An AMI for " + apiRequest.asgName,
        InstanceId: apiRequest.instanceId,
        Name: apiRequest.amiName + '-' + runDate,
        NoReboot: true
    };
    
    console.log(JSON.stringify(ec2ImageParams, undefined, 2));
    
    const ciResponse = await ec2.createImage(ec2ImageParams).promise();

    console.log(JSON.stringify(ciResponse, undefined, 2));

    var ec2Params: DescribeImagesRequest =  {       
        ImageIds: [ciResponse.ImageId!]
    }
    
    var asgParams: AutoScalingGroupNamesType = {
        AutoScalingGroupNames: [
            apiRequest.asgName
        ]
    };

    const asgResponse = await autoscaling.describeAutoScalingGroups(asgParams).promise();
    console.log(asgResponse, undefined, 2);

    //Get current load configuration
    const sourceLaunchConfig = asgResponse.AutoScalingGroups[0].LaunchConfigurationName;
    console.log('current launch config name: ' + sourceLaunchConfig);

    var lcParams: LaunchConfigurationNamesType = {
        LaunchConfigurationNames: [sourceLaunchConfig!]
    }
    const lcResponse = await autoscaling.describeLaunchConfigurations(lcParams).promise();
    console.log(JSON.stringify(lcResponse));

    const newLaunchConfigName =  apiRequest.asgName + '_'+ ciResponse.ImageId + '_' + runDate;
    console.log('New launch configuration name: ' + newLaunchConfigName);

    const ec2Response = await ec2.describeImages(ec2Params).promise();
    console.log(JSON.stringify(ec2Response, undefined, 2));

    const clcParams: CreateLaunchConfigurationType = {
        //InstanceId: sourceInstanceId,
        IamInstanceProfile: lcResponse.LaunchConfigurations[0].IamInstanceProfile, 
        ImageId: ciResponse.ImageId, 
        InstanceType: lcResponse.LaunchConfigurations[0].InstanceType, 
        LaunchConfigurationName: newLaunchConfigName, 
        SecurityGroups: lcResponse.LaunchConfigurations[0].SecurityGroups,
        KeyName: lcResponse.LaunchConfigurations[0].KeyName,
        EbsOptimized: lcResponse.LaunchConfigurations[0].EbsOptimized,
        AssociatePublicIpAddress : lcResponse.LaunchConfigurations[0].AssociatePublicIpAddress,
        BlockDeviceMappings: ec2Response.Images![0].BlockDeviceMappings as BlockDeviceMappings
    };

    const clcResponse = await autoscaling.createLaunchConfiguration(clcParams).promise();
    console.log(JSON.stringify(clcResponse,undefined, 2));

    const uasgParams: UpdateAutoScalingGroupType = {
        AutoScalingGroupName: apiRequest.asgName,
        LaunchConfigurationName : newLaunchConfigName
    }

    const uasgResponse = await autoscaling.updateAutoScalingGroup(uasgParams).promise();
    console.log(JSON.stringify(uasgResponse,undefined,2));


    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify( {
        'LaunchConfigurationName': newLaunchConfigName,
        'AMI-id': ciResponse.ImageId
        })
    };
  };