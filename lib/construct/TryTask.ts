import * as cdk from '@aws-cdk/core';
import * as sfn from '@aws-cdk/aws-stepfunctions';

/**
 * Properties for defining a try/catch/finally construct.
 */
export interface TryProps {
    /**
     * An optional description for this state
     *
     * @default No comment
     */
    readonly comment?: string;
    /**
     * JSONPath expression to select part of the state to be the input to this state.
     *
     * May also be the special value DISCARD, which will cause the effective
     * input to be the empty object {}.
     *
     * @default $
     */
    readonly inputPath?: string;
    /**
     * JSONPath expression to indicate where to inject the state's output
     *
     * May also be the special value DISCARD, which will cause the state's
     * input to become its output.
     *
     * @default $
     */
    readonly resultPath?: string;

    /**
     * Try chain to execute.
     */
    readonly tryProcess: sfn.IChainable;

    /**
     * Catch properties.
     */
    readonly catchProps?: sfn.CatchProps; // provide catch-all default

    /**
     * Optional catch chain to execute.
     */
    readonly catchProcess?: sfn.IChainable;

    /**
     * JSONPath expression to indicate where to map caught exception details.
     */
    readonly finallyErrorPath?: string;

    /**
     * Optional finally chain to execute.
     */
    readonly finallyProcess?: sfn.IChainable;
} 

/**
 * Define a construct that helps with handling StepFunctions exceptions.
 */
export class TryTask extends sfn.Parallel {

  constructor(scope: cdk.Construct, id: string, props: TryProps) {
    const parallelProps = {
      comment: props.comment,
      inputPath: props.inputPath,
      outputPath: "$[0]",
      resultPath: props.resultPath
    } as sfn.ParallelProps

    super(scope, id, parallelProps)

    let process = props.tryProcess;

    if (props.catchProcess) {
      process = new sfn.Parallel(this, this.createStateName('TryCatch'), {  
        outputPath: "$[0]" // unwrap result from the first (and only) branch
      })
        .branch(process)
        .addCatch(props.catchProcess, props.catchProps);
    }
    
    if (props.finallyProcess) {
      process = new sfn.Parallel(this, this.createStateName('TryFinally'), { 
        outputPath: "$[0]" // unwrap result from the first (and only) branch
      })
        .branch(process)
        .addCatch(props.finallyProcess, {
          resultPath: props.finallyErrorPath
        })
        .next(props.finallyProcess);
    }

    this.branch(process);
  }

  private createStateName(name: string): string {
    return `${name}_${this.node.uniqueId}`;
  }
}