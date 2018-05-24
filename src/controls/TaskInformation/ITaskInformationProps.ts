import { ITasks } from "mcs-lms-core";

export interface ITaskInformationProps {
    task: ITasks;
    onCommentAdded?: (comment: string) => void;
    onCommentEnabled?: (visible: boolean) => void;
}