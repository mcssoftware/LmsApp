import { IList } from "mcs-lms-core";

export interface IListSelectState {
    loading: boolean;
    error: string;
    items: IList[];
}