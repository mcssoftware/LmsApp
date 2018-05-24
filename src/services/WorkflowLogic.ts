/*import { IBills, IWorkflowDefinition } from "../interfaces";
import { McsUtil } from "../libraries/util";

export enum Chamber {
    None = 1,
    House,
    Senate,
}

// tslint:disable:variable-name
// tslint:disable:member-ordering
export class WorkflowLogic {
    public static HouseBudgetBillNumber: string = "HB0001";
    public static SenateBudgetBillNumber: string = "SF0001";

    public static ObtainSponsorApproval: number = 124;
    public static NumberBillStepId: number = 130;
    public static EngrossingBetweenChamber: number = 600;
    public static EngrossingAfterChamber: number = 4825;
    public static House3RdReadingStepId: number = 470;
    public static HouseContd3RdReadingStepId: number = 480;
    public static Senate3RdReadingStepId: number = 1290;
    public static SenateContd3RdReadingStepId: number = 1300;
    public static SendForHouseIntroduction: number = 150;
    public static HouseReceivedForIntroduction: number = 170;
    public static SendForSenateIntroduction: number = 1000;
    public static SenateReceivedForIntroduction: number = 1020;
    public static SendForHouseConcurrence: number = 2000;
    public static SendForSenateConcurrence: number = 2100;
    public static Enrolling: number = 4850;
    public static HouseSignature: number = 4900;
    public static SenateSignature: number = 4950;
    public static GovernorSigned: number = 5010;
    public static HousePostpone: number = 590;
    public static SenatePostpone: number = 1390;
    // house and senate general file in opposite chambers are only available for none budget bills.
    public static PlaceOnSenateGeneralFile: number = 1190;
    public static PlaceOnHouseGeneralFile: number = 249;
    // assign JCC members parallel task are only available for budget bills
    public static AssignJcc1MembersParallelTask: number = 3000;
    public static AssignJcc2MembersParallelTask: number = 3200;
    public static AssignJcc3MembersParallelTask: number = 3400;
    public static AssignJcc4MembersParallelTask: number = 3600;
    public static AssignJcc5MembersParallelTask: number = 3800;
    public static AssignJcc6MembersParallelTask: number = 4000;
    public static AssignJcc7MembersParallelTask: number = 4200;
    public static AssignJcc8MembersParallelTask: number = 4400;
    public static AssignJcc9MembersParallelTask: number = 4600;

    public static HouseJcc1Assignment: number = 3020;
    public static SenateJcc1Assignment: number = 3040;
    public static HouseJcc2Assignment: number = 3220;
    public static SenateJcc2Assignment: number = 3240;
    public static HouseJcc3Assignment: number = 3420;
    public static SenateJcc3Assignment: number = 3440;
    public static HouseJcc4Assignment: number = 3620;
    public static SenateJcc4Assignment: number = 3640;
    public static HouseJcc5Assignment: number = 3820;
    public static SenateJcc5Assignment: number = 3840;
    public static HouseJcc6Assignment: number = 4020;
    public static SenateJcc6Assignment: number = 4040;
    public static HouseJcc7Assignment: number = 4220;
    public static SenateJcc7Assignment: number = 4240;
    public static HouseJcc8Assignment: number = 4420;
    public static SenateJcc8Assignment: number = 4440;
    public static HouseJcc9Assignment: number = 4620;
    public static SenateJcc9Assignment: number = 4640;
    public static AllJccAssignment: number[] = [
        WorkflowLogic.HouseJcc1Assignment,
        WorkflowLogic.SenateJcc1Assignment,
        WorkflowLogic.HouseJcc2Assignment,
        WorkflowLogic.SenateJcc2Assignment,
        WorkflowLogic.HouseJcc3Assignment,
        WorkflowLogic.SenateJcc3Assignment,
        WorkflowLogic.HouseJcc4Assignment,
        WorkflowLogic.SenateJcc4Assignment,
        WorkflowLogic.HouseJcc5Assignment,
        WorkflowLogic.SenateJcc5Assignment,
        WorkflowLogic.HouseJcc6Assignment,
        WorkflowLogic.SenateJcc6Assignment,
        WorkflowLogic.HouseJcc7Assignment,
        WorkflowLogic.SenateJcc7Assignment,
        WorkflowLogic.HouseJcc8Assignment,
        WorkflowLogic.SenateJcc8Assignment,
        WorkflowLogic.HouseJcc9Assignment,
        WorkflowLogic.SenateJcc9Assignment,
    ];
    public static HouseAdoptJcc1: number = 3120;
    public static SenateAdoptJcc1: number = 3140;
    public static HouseAdoptJcc2: number = 3320;
    public static SenateAdoptJcc2: number = 3340;
    public static HouseAdoptJcc3: number = 3520;
    public static SenateAdoptJcc3: number = 3540;
    public static HouseAdoptJcc4: number = 3720;
    public static SenateAdoptJcc4: number = 3740;
    public static HouseAdoptJcc5: number = 3920;
    public static SenateAdoptJcc5: number = 3940;
    public static HouseAdoptJcc6: number = 4120;
    public static SenateAdoptJcc6: number = 4140;
    public static HouseAdoptJcc7: number = 4320;
    public static SenateAdoptJcc7: number = 4340;
    public static HouseAdoptJcc8: number = 4520;
    public static SenateAdoptJcc8: number = 4540;
    public static HouseAdoptJcc9: number = 4720;
    public static SenateAdoptJcc9: number = 4740;
    public static AllJccAdopt: number[] = [
        WorkflowLogic.HouseAdoptJcc1,
        WorkflowLogic.SenateAdoptJcc1,
        WorkflowLogic.HouseAdoptJcc2,
        WorkflowLogic.SenateAdoptJcc2,
        WorkflowLogic.HouseAdoptJcc3,
        WorkflowLogic.SenateAdoptJcc3,
        WorkflowLogic.HouseAdoptJcc3,
        WorkflowLogic.SenateAdoptJcc3,
        WorkflowLogic.HouseAdoptJcc4,
        WorkflowLogic.SenateAdoptJcc4,
        WorkflowLogic.HouseAdoptJcc5,
        WorkflowLogic.SenateAdoptJcc5,
        WorkflowLogic.HouseAdoptJcc6,
        WorkflowLogic.SenateAdoptJcc6,
        WorkflowLogic.HouseAdoptJcc7,
        WorkflowLogic.SenateAdoptJcc7,
        WorkflowLogic.HouseAdoptJcc8,
        WorkflowLogic.SenateAdoptJcc8,
        WorkflowLogic.HouseAdoptJcc9,
        WorkflowLogic.SenateAdoptJcc9,
    ];
    // for house calendar
    public static HouseSecondReading: number = 350;
    public static HouseThirdReading: number = 470;
    public static HouseGeneralFile: number = 250;
    // for senate calendar
    public static SenateSecondReading: number = 1250;
    public static SenateThirdReading: number = 1290;
    public static SenateGeneralFile: number = 1200;
    // for Veto
    public static HouseVetoOverride: number = 5525;
    public static SenateVetoOverride: number = 5550;
    // for create bill summary task
    public static CreateBillSummary: number = 4860;

    public static IsNextStepApproved(currentStep: IWorkflowDefinition, nextStep: IWorkflowDefinition, bill: IBills): boolean {
        let stepIsApproved: boolean = false;
        try {
            let logicApplied: boolean = true;
            // to go by current steps
            switch (currentStep.Step) {
                case WorkflowLogic.NumberBillStepId:
                    // on number bill task only approve task going to house of origin step
                    stepIsApproved = WorkflowLogic.StepIsInHouseOfOrigin(nextStep, bill); break;
                case WorkflowLogic.EngrossingBetweenChamber:
                    // on engrossing between task only approve task going to opposite chamber
                    stepIsApproved = WorkflowLogic.StepIsInOppositeChamber(nextStep, bill);
                    break;
                case WorkflowLogic.House3RdReadingStepId:
                case WorkflowLogic.HouseContd3RdReadingStepId:
                case WorkflowLogic.Senate3RdReadingStepId:
                case WorkflowLogic.SenateContd3RdReadingStepId:
                    {
                        switch (nextStep.Step) {
                            case WorkflowLogic.SendForHouseIntroduction:
                            case WorkflowLogic.SendForSenateIntroduction:
                                stepIsApproved = WorkflowLogic.StepIsInHouseOfOrigin(currentStep, bill) &&
                                    WorkflowLogic.StepIsInOppositeChamber(nextStep, bill) &&
                                    (WorkflowLogic.IsBudgetBill(bill) || !WorkflowLogic.HasAmendmentInHouseOfOrigin(bill));
                                break;
                            case WorkflowLogic.EngrossingBetweenChamber:
                                stepIsApproved = !WorkflowLogic.IsBudgetBill(bill) &&
                                    WorkflowLogic.StepIsInHouseOfOrigin(currentStep, bill) && WorkflowLogic.HasAmendmentInHouseOfOrigin(bill);
                                break;
                            case WorkflowLogic.SendForHouseConcurrence:
                            case WorkflowLogic.SendForSenateConcurrence:
                                stepIsApproved = WorkflowLogic.StepIsInOppositeChamber(currentStep, bill) &&
                                    WorkflowLogic.StepIsInHouseOfOrigin(nextStep, bill) &&
                                    WorkflowLogic.HasAmendmentInOppositeChamber(bill);
                                break;
                            case WorkflowLogic.Enrolling:
                                stepIsApproved = WorkflowLogic.StepIsInOppositeChamber(currentStep, bill) &&
                                    !WorkflowLogic.HasAmendmentInOppositeChamber(bill);
                                break;
                            default: logicApplied = false; break;
                        }
                        break;
                    }
                case WorkflowLogic.Enrolling:
                    stepIsApproved = WorkflowLogic.StepIsInHouseOfOrigin(nextStep, bill);
                    break;
                case WorkflowLogic.HouseSignature:
                case WorkflowLogic.SenateSignature:
                    stepIsApproved = WorkflowLogic.StepIsInHouseOfOrigin(currentStep, bill) ?
                        WorkflowLogic.StepIsInOppositeChamber(nextStep, bill) : !WorkflowLogic.StepIsInHouseOfOrigin(nextStep, bill);
                    break;
                default: logicApplied = false; break;
            }
            if (!logicApplied) {
                switch (nextStep.Step) {
                    case WorkflowLogic.PlaceOnHouseGeneralFile:
                    case WorkflowLogic.PlaceOnSenateGeneralFile:
                        stepIsApproved = !(WorkflowLogic.StepIsInOppositeChamber(nextStep, bill) && WorkflowLogic.IsBudgetBill(bill));
                        break;
                    case WorkflowLogic.HousePostpone:
                    case WorkflowLogic.SenatePostpone:
                        stepIsApproved = !WorkflowLogic.IsBudgetBill(bill);
                        break;
                    case WorkflowLogic.AssignJcc1MembersParallelTask:
                        stepIsApproved = WorkflowLogic.StepIsInOppositeChamber(currentStep, bill) && WorkflowLogic.IsBudgetBill(bill);
                        break;
                    case WorkflowLogic.AssignJcc2MembersParallelTask:
                    case WorkflowLogic.AssignJcc3MembersParallelTask:
                    case WorkflowLogic.AssignJcc4MembersParallelTask:
                    case WorkflowLogic.AssignJcc5MembersParallelTask:
                    case WorkflowLogic.AssignJcc6MembersParallelTask:
                    case WorkflowLogic.AssignJcc7MembersParallelTask:
                    case WorkflowLogic.AssignJcc8MembersParallelTask:
                    case WorkflowLogic.AssignJcc9MembersParallelTask:
                        stepIsApproved = WorkflowLogic.IsBudgetBill(bill);
                        break;
                    case WorkflowLogic.HouseJcc1Assignment:
                    case WorkflowLogic.SenateJcc1Assignment:
                    case WorkflowLogic.HouseJcc2Assignment:
                    case WorkflowLogic.SenateJcc2Assignment:
                    case WorkflowLogic.HouseJcc3Assignment:
                    case WorkflowLogic.SenateJcc3Assignment:
                    case WorkflowLogic.HouseJcc4Assignment:
                    case WorkflowLogic.SenateJcc4Assignment:
                    case WorkflowLogic.HouseJcc5Assignment:
                    case WorkflowLogic.SenateJcc5Assignment:
                    case WorkflowLogic.HouseJcc6Assignment:
                    case WorkflowLogic.SenateJcc6Assignment:
                    case WorkflowLogic.HouseJcc7Assignment:
                    case WorkflowLogic.SenateJcc7Assignment:
                    case WorkflowLogic.HouseJcc8Assignment:
                    case WorkflowLogic.SenateJcc8Assignment:
                    case WorkflowLogic.HouseJcc9Assignment:
                    case WorkflowLogic.SenateJcc9Assignment:
                        stepIsApproved = true;
                        // StepIsInHouseOfOrigin(nextStep, bill) || JccAdoptInHouseOfOrigin(nextStep, bill);
                        break;
                    case WorkflowLogic.HouseAdoptJcc1:
                    case WorkflowLogic.SenateAdoptJcc1:
                    case WorkflowLogic.HouseAdoptJcc2:
                    case WorkflowLogic.SenateAdoptJcc2:
                    case WorkflowLogic.HouseAdoptJcc3:
                    case WorkflowLogic.SenateAdoptJcc3:
                    case WorkflowLogic.HouseAdoptJcc4:
                    case WorkflowLogic.SenateAdoptJcc4:
                    case WorkflowLogic.HouseAdoptJcc5:
                    case WorkflowLogic.SenateAdoptJcc5:
                    case WorkflowLogic.HouseAdoptJcc6:
                    case WorkflowLogic.SenateAdoptJcc6:
                    case WorkflowLogic.HouseAdoptJcc7:
                    case WorkflowLogic.SenateAdoptJcc7:
                    case WorkflowLogic.HouseAdoptJcc8:
                    case WorkflowLogic.SenateAdoptJcc8:
                    case WorkflowLogic.HouseAdoptJcc9:
                    case WorkflowLogic.SenateAdoptJcc9:
                        stepIsApproved = WorkflowLogic.IsNotJccTask(nextStep) ||
                            (WorkflowLogic.IsNextJccNumber(currentStep, nextStep) && WorkflowLogic.JccAdoptInHouseOfOrigin(nextStep, bill)) ||
                            WorkflowLogic.JccAdoptInOppositeChamber(nextStep, bill);
                        break;
                    default:
                        stepIsApproved = true;
                        break;
                }
            }
        } catch (e) {
            // if there is error while process ignore error and approve the step
            return true;
        }

        return stepIsApproved;
    }

    public static getChamberForStep(step: IWorkflowDefinition): Chamber {
        if (McsUtil.isDefined(step) && McsUtil.isString(step.Chamber)) {
            if (/house/gi.test(step.Chamber)) {
                return Chamber.House;
            }
            if (/senate/gi.test(step.Chamber)) {
                return Chamber.Senate;
            }
        }
        return Chamber.None;
    }

    public static getHouseOfOriginForBill(bill: IBills): Chamber {
        if (McsUtil.isDefined(bill) && McsUtil.isString(bill.HouseofOrigin)) {
            if (/house/gi.test(bill.HouseofOrigin)) {
                return Chamber.House;
            }
            if (/senate/gi.test(bill.HouseofOrigin)) {
                return Chamber.Senate;
            }
        }
        return Chamber.None;
    }

    private static IsNotJccTask(step: IWorkflowDefinition): boolean {
        return McsUtil.toNumber(step.CommitteeID) > 0;
    }

    private static JccAdoptInOppositeChamber(step: IWorkflowDefinition, bill: IBills): boolean {
        const stepChamber: Chamber = WorkflowLogic.getChamberForStep(step);
        const billHouseOfOrigin: Chamber = WorkflowLogic.getHouseOfOriginForBill(bill);
        return ((stepChamber !== Chamber.None) && (billHouseOfOrigin !== Chamber.None) && (stepChamber !== billHouseOfOrigin)) &&
            ((step.Step === WorkflowLogic.HouseAdoptJcc1) || (step.Step === WorkflowLogic.SenateAdoptJcc1) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc2) || (step.Step === WorkflowLogic.SenateAdoptJcc2) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc3) || (step.Step === WorkflowLogic.SenateAdoptJcc3) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc4) || (step.Step === WorkflowLogic.SenateAdoptJcc4) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc5) || (step.Step === WorkflowLogic.SenateAdoptJcc5) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc6) || (step.Step === WorkflowLogic.SenateAdoptJcc6) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc7) || (step.Step === WorkflowLogic.SenateAdoptJcc7) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc8) || (step.Step === WorkflowLogic.SenateAdoptJcc8) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc9) || (step.Step === WorkflowLogic.SenateAdoptJcc9));
    }

    private static JccAdoptInHouseOfOrigin(step: IWorkflowDefinition, bill: IBills): boolean {
        const stepChamber: Chamber = WorkflowLogic.getChamberForStep(step);
        const billHouseOfOrigin: Chamber = WorkflowLogic.getHouseOfOriginForBill(bill);
        return (stepChamber !== Chamber.None && billHouseOfOrigin !== Chamber.None && stepChamber === billHouseOfOrigin) &&
            ((step.Step === WorkflowLogic.HouseAdoptJcc1) || (step.Step === WorkflowLogic.SenateAdoptJcc1) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc2) || (step.Step === WorkflowLogic.SenateAdoptJcc2) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc3) || (step.Step === WorkflowLogic.SenateAdoptJcc3) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc4) || (step.Step === WorkflowLogic.SenateAdoptJcc4) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc5) || (step.Step === WorkflowLogic.SenateAdoptJcc5) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc6) || (step.Step === WorkflowLogic.SenateAdoptJcc6) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc7) || (step.Step === WorkflowLogic.SenateAdoptJcc7) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc8) || (step.Step === WorkflowLogic.SenateAdoptJcc8) ||
                (step.Step === WorkflowLogic.HouseAdoptJcc9) || (step.Step === WorkflowLogic.SenateAdoptJcc9));
    }

    private static IsNextJccNumber(currentJccStep: IWorkflowDefinition, nextJccStep: IWorkflowDefinition): boolean {
        const jcc1CommitteeId: number = McsUtil.toNumber(currentJccStep.CommitteeID);
        const jcc2CommitteeId: number = McsUtil.toNumber(nextJccStep.CommitteeID);
        return ((jcc1CommitteeId > 0) && (jcc2CommitteeId > 0) && (jcc2CommitteeId > jcc1CommitteeId));
    }

    public static HasAmendmentInOppositeChamber(bill: IBills): boolean {
        const billHouseOfOrigin: Chamber = WorkflowLogic.getHouseOfOriginForBill(bill);
        return ((billHouseOfOrigin === Chamber.House) && bill.SenateAmendments) ||
            ((billHouseOfOrigin === Chamber.Senate) && bill.HouseAmendments);
    }

    public static HasAmendmentInHouseOfOrigin(bill: IBills): boolean {
        const billHouseOfOrigin: Chamber = WorkflowLogic.getHouseOfOriginForBill(bill);
        return ((billHouseOfOrigin === Chamber.House) && bill.HouseAmendments) ||
            ((billHouseOfOrigin === Chamber.Senate) && bill.SenateAmendments);
    }

    public static StepIsInHouseOfOrigin(step: IWorkflowDefinition, bill: IBills): boolean {
        const stepChamber: Chamber = WorkflowLogic.getChamberForStep(step);
        const billHouseOfOrigin: Chamber = WorkflowLogic.getHouseOfOriginForBill(bill);

        return ((stepChamber !== Chamber.None) && (billHouseOfOrigin !== Chamber.None) && (stepChamber === billHouseOfOrigin));
    }

    public static StepIsInOppositeChamber(step: IWorkflowDefinition, bill: IBills): boolean {
        const stepChamber: Chamber = WorkflowLogic.getChamberForStep(step);
        const billHouseOfOrigin: Chamber = WorkflowLogic.getHouseOfOriginForBill(bill);

        return ((stepChamber !== Chamber.None) && (billHouseOfOrigin !== Chamber.None) && (stepChamber !== billHouseOfOrigin));
    }

    public static IsNumberingStep(step: IWorkflowDefinition): boolean {
        return ((step !== null) && (step.Step === WorkflowLogic.NumberBillStepId));
    }

    public static GetJccCommitteeIDOnStep(step: number): number {
        switch (step) {
            case WorkflowLogic.HouseAdoptJcc1:
            case WorkflowLogic.SenateAdoptJcc1:
            case WorkflowLogic.HouseJcc1Assignment:
            case WorkflowLogic.SenateJcc1Assignment: return 1;
            case WorkflowLogic.HouseAdoptJcc2:
            case WorkflowLogic.SenateAdoptJcc2:
            case WorkflowLogic.HouseJcc2Assignment:
            case WorkflowLogic.SenateJcc2Assignment: return 2;
            case WorkflowLogic.HouseAdoptJcc3:
            case WorkflowLogic.SenateAdoptJcc3:
            case WorkflowLogic.HouseJcc3Assignment:
            case WorkflowLogic.SenateJcc3Assignment: return 3;
            case WorkflowLogic.HouseAdoptJcc4:
            case WorkflowLogic.SenateAdoptJcc4:
            case WorkflowLogic.HouseJcc4Assignment:
            case WorkflowLogic.SenateJcc4Assignment: return 4;
            case WorkflowLogic.HouseAdoptJcc5:
            case WorkflowLogic.SenateAdoptJcc5:
            case WorkflowLogic.HouseJcc5Assignment:
            case WorkflowLogic.SenateJcc5Assignment: return 5;
            case WorkflowLogic.HouseAdoptJcc6:
            case WorkflowLogic.SenateAdoptJcc6:
            case WorkflowLogic.HouseJcc6Assignment:
            case WorkflowLogic.SenateJcc6Assignment: return 6;
            case WorkflowLogic.HouseAdoptJcc7:
            case WorkflowLogic.SenateAdoptJcc7:
            case WorkflowLogic.HouseJcc7Assignment:
            case WorkflowLogic.SenateJcc7Assignment: return 7;
            case WorkflowLogic.HouseAdoptJcc8:
            case WorkflowLogic.SenateAdoptJcc8:
            case WorkflowLogic.HouseJcc8Assignment:
            case WorkflowLogic.SenateJcc8Assignment: return 8;
            case WorkflowLogic.HouseAdoptJcc9:
            case WorkflowLogic.SenateAdoptJcc9:
            case WorkflowLogic.HouseJcc9Assignment:
            case WorkflowLogic.SenateJcc9Assignment: return 9;
            default:
                return 0;
        }
    }

    public static AllowReleaseBill(step: IWorkflowDefinition): boolean {
        return ((step !== null) && (step.Step === WorkflowLogic.ObtainSponsorApproval));
    }

    public static IsVetoOverrideStep(step: IWorkflowDefinition): boolean {
        return (step !== null) && ((step.Step === WorkflowLogic.HouseVetoOverride) || (step.Step === WorkflowLogic.SenateVetoOverride));
    }

    public static IsJccTask(step: IWorkflowDefinition, bill: IBills): boolean {
        return McsUtil.isNumeric(step.CommitteeID) && McsUtil.isString(bill.BillNumber);
    }

    public static IsBudgetBill(bill: IBills): boolean {
        return (new RegExp(WorkflowLogic.HouseBudgetBillNumber, "gi")).test(bill.BillNumber) ||
            (new RegExp(WorkflowLogic.SenateBudgetBillNumber, "gi")).test(bill.BillNumber);
    }
}

*/