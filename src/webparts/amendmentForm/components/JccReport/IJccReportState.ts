import { IAmendmentEntity } from "mcs-lms-core";

export interface IJccReportState {
    showModal: boolean;
    loading: boolean;
    error: string;
    adoptedAmendments: IAmendmentEntity[];
}