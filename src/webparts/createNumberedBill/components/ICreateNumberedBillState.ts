import { ITasks, IWorkflowDefinition } from "mcs-lms-core";

export interface ICreateNumberedBillState {
    selectedChoice: string;
    existingBills: string[];
    canCreateBudgetBill: boolean;
    canCreateAppropriationBill: boolean;
    billNumbered: boolean;
    showSpinner: boolean;
}