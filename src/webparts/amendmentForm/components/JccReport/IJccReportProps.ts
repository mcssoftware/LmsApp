import { IBills, IAmendmentEntity } from "mcs-lms-core";

export interface IJccReportProps {
    showJccForm: boolean;
    bill: IBills;
    isLocalEnvironment: boolean;
    onDismiss: (houseOfOriginAdoptedAmendment: IAmendmentEntity[], oppositeChamberAdoptedAmendment: IAmendmentEntity[]) => void;
}