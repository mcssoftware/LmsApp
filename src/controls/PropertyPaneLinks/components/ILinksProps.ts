import ILinks from "../ILinks";

export interface ILinksProps {
    label: string;
    Items: ILinks[];
    onChanged: (option: ILinks[]) => void;
    stateKey: string;
}