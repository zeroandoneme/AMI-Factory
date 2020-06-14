const AWS = require('aws-sdk');

export const handler = async (event: any) : Promise <any> => {

    console.log("request:", JSON.stringify(event, undefined, 2));

    const autoscaling = new AWS.AutoScaling();
    const ec2 = new AWS.EC2();
    const asgName = 'cuple-asg'
    const instanceId = "i-0c5ad0d86f612f3c6";
    let runDate = new Date().toISOString().substring(0, 19).replace(':','-').replace(':','-');
    
    const ec2ImageParams = {
        Description: "An AMI for cuple-asg",
        InstanceId: instanceId,
        Name: 'cuple-' + runDate,
        NoReboot: true
    };
    
    console.log(JSON.stringify(ec2ImageParams, undefined, 2));
    
    const ciResponse = await ec2.createImage(ec2ImageParams).promise();
    console.log(JSON.stringify(ciResponse, undefined, 2));

    var asgParams = {
        AutoScalingGroupNames: [
           asgName
        ]
    };

    const asgResponse = await autoscaling.describeAutoScalingGroups(asgParams).promise();
    console.log(asgResponse, undefined, 2);

    //This is used in new launchconfiguration or we can set them manually.
    //const sourceInstanceId = asgResponse.AutoScalingGroups[0].Instances[0].instanceId;

    var ec2Params = {
        ImageIds: [ciResponse.ImageId]
    }

    const ec2Response = await ec2.describeImages(ec2Params).promise();
    console.log(JSON.stringify(ec2Response, undefined, 2));

    const sourceAmiSnapshot = ec2Response.Images[0].BlockDeviceMappings[0].Ebs.SnapshotId;
    console.log('New source AMI: ami-09a5756f493a9a9d7' + " has snapshot ID: " + sourceAmiSnapshot);

    //Get current load configuration
    const sourceLaunchConfig = asgResponse.AutoScalingGroups[0].LaunchConfigurationName;
    console.log('current launch config name: ' + sourceLaunchConfig);

    var lcParams = {
        LaunchConfigurationNames: [sourceLaunchConfig]
    }
    const lcResponse = await autoscaling.describeLaunchConfigurations(lcParams).promise();
    console.log(JSON.stringify(lcResponse));

    var sourceBlockDevices = lcResponse.LaunchConfigurations[0].BlockDeviceMappings;
    console.log('Current Block Devices: ' + JSON.stringify(sourceBlockDevices));
    sourceBlockDevices[0].Ebs.SnapshotId = sourceAmiSnapshot
    console.log('New Block Devices: ' + JSON.stringify(sourceBlockDevices));

    const newLaunchConfigName = asgName + '_'+ ciResponse.ImageId + '_' + runDate;
    console.log('New launch configuration name: ' + newLaunchConfigName);

    const clcParams = {
        //InstanceId: sourceInstanceId,
        IamInstanceProfile: lcResponse.LaunchConfigurations[0].IamInstanceProfile, 
        ImageId: ciResponse.ImageId, 
        InstanceType: lcResponse.LaunchConfigurations[0].InstanceType, 
        LaunchConfigurationName: newLaunchConfigName, 
        SecurityGroups: lcResponse.LaunchConfigurations[0].SecurityGroups,
        KeyName: lcResponse.LaunchConfigurations[0].KeyName,
        EbsOptimized: lcResponse.LaunchConfigurations[0].EbsOptimized,
        AssociatePublicIpAddress : lcResponse.LaunchConfigurations[0].AssociatePublicIpAddress,
        BlockDeviceMappings: sourceBlockDevices
    };

    const clcResponse = await autoscaling.createLaunchConfiguration(clcParams).promise();
    console.log(JSON.stringify(clcResponse,undefined, 2));

    const uasgParams = {
        AutoScalingGroupName: asgName,
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