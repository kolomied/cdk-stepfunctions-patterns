# cdk-stepfunctions-patterns
![build](https://github.com/kolomied/cdk-stepfunctions-patterns/workflows/build/badge.svg)
![jsii-publish](https://github.com/kolomied/cdk-stepfunctions-patterns/workflows/jsii-publish/badge.svg)
![downloads](https://img.shields.io/npm/dt/cdk-stepfunctions-patterns)

[![npm version](https://badge.fury.io/js/cdk-stepfunctions-patterns.svg)](https://badge.fury.io/js/cdk-stepfunctions-patterns)
[![PyPI version](https://badge.fury.io/py/cdk-stepfunctions-patterns.svg)](https://badge.fury.io/py/cdk-stepfunctions-patterns)
[![NuGet version](https://badge.fury.io/nu/Talnakh.StepFunctions.Patterns.svg)](https://badge.fury.io/nu/Talnakh.StepFunctions.Patterns)

*cdk-stepfunctions-patterns* library is a set of [AWS CDK](https://aws.amazon.com/cdk/) constructs that provide 
resiliency patterns implementation for AWS Step Functions.

## Try / Catch pattern

### Example
```typescript
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { TryTask } from 'cdk-stepfunctions-patterns';

// ...

new sfn.StateMachine(this, 'TryCatchStepMachine', {
  definition: new TryTask(this, "TryCatch", {
    tryProcess: new sfn.Pass(this, 'A1').next(new sfn.Pass(this, 'B1')),
    catchProcess: new sfn.Pass(this, 'catchHandler'),
    // optional configuration properties
    catchProps: {
      errors: ['Lambda.AWSLambdaException'],
      resultPath: "$.ErrorDetails"
    }
  })
})
```

### Resulting StepFunction
![](doc/tryCatch.png)


## Try / Finally pattern 

### Example

```typescript
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { TryTask } from 'cdk-stepfunctions-patterns';

// ...

new sfn.StateMachine(this, 'TryFinallyStepMachine', {
    definition: new TryTask(this, "TryFinally", {
    tryProcess: new sfn.Pass(this, 'A2').next(new sfn.Pass(this, 'B2')),
    finallyProcess: new sfn.Pass(this, 'finallyHandler'),
    // optional configuration properties
    catchErrorPath: "$.FinallyErrorDetails"
    })
})
```

### Resulting StepFunction
![](doc/tryFinally.png)

## Try / Catch / Finally pattern

### Example
```typescript
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { TryTask } from 'cdk-stepfunctions-patterns';

// ...

new sfn.StateMachine(this, 'TryCatchFinallyStepMachine', {
    definition: new TryTask(this, "TryCatchFinalli", {
    tryProcess: new sfn.Pass(this, 'A3').next(new sfn.Pass(this, 'B3')),
    catchProcess: new sfn.Pass(this, 'catchHandler3'),
    finallyProcess: new sfn.Pass(this, 'finallyHandler3')
    })
})
```

### Resulting StepFunction
![](doc/tryCatchFinally.png)

## Retry with backoff and jitter

### Example
```typescript
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { RetryWithJitterTask } from 'cdk-stepfunctions-patterns';

// ...

new sfn.StateMachine(this, 'RetryWithJitterStepMachine', {
    definition: new RetryWithJitterTask(this, "AWithJitter", {
    tryProcess: new sfn.Pass(this, 'A4').next(new sfn.Pass(this, 'B4')),
    retryProps: { errors: ["States.ALL"], maxAttempts: 3 }
    })
})
```

### Resulting StepFunction
![](doc/retryWithJitter.png)