import { IViewField } from "../../../controls/ListView/IListView";
import { IList, IListItem } from "mcs-lms-core";
import { IListRestFilter } from "../../../services/ListService";

export interface ICustomListViewState {
    options: IListRestFilter;
    items: any[];
    filterItem?: IListItem;
    loading: boolean;
    formDefaultValues: any;
}