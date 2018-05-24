import { ITasks, IWorkflowDefinition, ICommittee } from "mcs-lms-core";
import { IColumn } from "office-ui-fabric-react";

export interface IJccAssignmentState {
    loading: boolean;
    error: string;
    inactiveCommittees: any[]; // the committee list that arenot added
    jccAssignment: IJccAssignment;
    showSpinner: boolean;
}

export interface IJccAssignment {
    MeetingDate: string;
    MeetingTime: string;
    MeetingLocation: string;
    Committees: ICommittee[]; // the committee list that are added
    Chairman: string;
}