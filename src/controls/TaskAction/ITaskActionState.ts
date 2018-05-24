import { IPersonaProps } from "office-ui-fabric-react";

export interface ITaskActionState {
  selectedIndex: number;
  currentStepAssignedTo: IPersonaProps[];
  // loading: boolean;
  // error: string;
}