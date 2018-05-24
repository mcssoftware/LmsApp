import ILinks from "../../../controls/PropertyPaneLinks/ILinks";

export interface IBillFilterProps {
  isLocalEnvironment: boolean;
  showBillNumber: boolean;
  links: ILinks[];
  webUrl: string;
}
