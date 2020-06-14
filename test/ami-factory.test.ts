import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AmiFactory from '../lib/ami-factory-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AmiFactory.AmiFactoryStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
