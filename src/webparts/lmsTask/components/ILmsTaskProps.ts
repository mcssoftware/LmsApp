import { SPHttpClient } from "@microsoft/sp-http";
import { IBills, ITasks } from "mcs-lms-core";

export interface ILmsTaskProps {
  title: string;
  isLocalEnvironment: boolean;
  spHttpClient: SPHttpClient;
  /**
   * if true then disable button
   * @type {boolean}
   * @memberof ILmsTaskProps
   */
  isDisabled?: boolean; // if true then disable button
  /**
   * pass bills and task to child component
   * @memberof ILmsTaskProps
   */
  postComponentMount?: (bill: IBills, task: ITasks, getApiToken?: () => Promise<string>) => void;
  /**
   * if undefined, return empty virtual dom else call it
   * @memberof ILmsTaskProps
   */
  taskSpecificRender?: () => JSX.Element;
  /**
   * if success then call task complete function
   * @memberof ILmsTaskProps
   */
  preTaskCompletionAction?: (task: ITasks) => Promise<any>;

  /** Props to hide or show the task specific section i.e. the part which gets element from other components
   * @type {boolean}
   * @memberof ILmsTaskProps
   */
  showTaskSpecificSection?: boolean;
  /** Props to show the task action section
   * @type {boolean}
   * @memberof ILmsTaskProps
   */
  showTaskAction?: boolean;
  showSpinner: boolean;
}
