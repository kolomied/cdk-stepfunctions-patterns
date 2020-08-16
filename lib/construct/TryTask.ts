import * as cdk from '@aws-cdk/core';
import * as sfn from '@aws-cdk/aws-stepfunctions';

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

    readonly tryProcess: sfn.IChainable;

    readonly catchProps?: sfn.CatchProps; // provide catch-all default

    readonly catchProcess?: sfn.IChainable;

    readonly catchErrorPath?: string;

    readonly finallyProcess?: sfn.IChainable;
} 

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
          resultPath: props.catchErrorPath
        })
        .next(props.finallyProcess);
    }

    this.branch(process);
  }

  private createStateName(name: string): string {
    return `${name}_${this.node.uniqueId}`;
  }
}