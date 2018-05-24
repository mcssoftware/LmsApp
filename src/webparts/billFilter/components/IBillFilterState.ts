import { IBills } from "mcs-lms-core";
import ILinks from "../../../controls/PropertyPaneLinks/ILinks";

export interface IBillFilterState {
  billSearch: string;
  bill: IBills;
  links: ILinks[];
}
