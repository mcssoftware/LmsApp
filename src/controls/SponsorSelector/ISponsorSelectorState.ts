import { IDropdownOption } from "office-ui-fabric-react";
import { Constants, ILegislator, ICommittee } from "mcs-lms-core";

export interface ISponsorSelectorState {
  loading: boolean;
  loadingError: string;
  validationMessage: string;
  type: Constants.SponsorType;
  otherSponsorValue: string;
  selectedLegislator: ILegislator[];
  selectedCommittee: ICommittee;
}