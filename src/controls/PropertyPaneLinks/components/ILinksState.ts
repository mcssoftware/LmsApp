import ILinks from "../ILinks";

export interface ILinksState {
    Items: ILinks[];
    newItem: ILinks;
    editIndex: number;
    showDialog: boolean;
}