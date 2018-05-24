import { SPHttpClient } from "@microsoft/sp-http";
import { IWorkflowDefinition, IBills } from "mcs-lms-core";
import { SiteUserProps } from "sp-pnp-js";
export interface ITaskActionProps {
  isLocalEnvironment: boolean;
  spHttpClient: SPHttpClient;
  // currentStep: IWorkflowDefinition;
  required?: boolean;
  disabled?: boolean;
  actionClicked?: (selectedStep: IWorkflowDefinition) => void;
  bill?: IBills;
  nextSteps: IWorkflowDefinition[];
  showNextSteps: boolean;
}
