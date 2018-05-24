import * as React from "react";
import styles from "./LmsPeoplePicker.module.scss";
import { ILmsPeoplePickerProps } from "./ILmsPeoplePickerProps";
import {
  CompactPeoplePicker,
  IBasePickerSuggestionsProps,
  IPersonaProps,
  Label,
  IContextualMenuItem,
  BaseComponent,
  assign,
  autobind,
} from "office-ui-fabric-react";

import { ILmsPeoplePickerState } from "./ILmsPeoplePickerState";
import { PeopleService } from "../../services/PeopleService";
import { SiteUserProps } from "sp-pnp-js";
import { clone } from "@microsoft/sp-lodash-subset";
import { people } from "./LmsPeoplePickerExampleData";
import { McsUtil } from "mcs-lms-core";
import { mockPeoplePickerList } from "./MockPeoplePickerList";

const suggestionProps: IBasePickerSuggestionsProps = {
  suggestionsHeaderText: "Suggested People",
  noResultsFoundText: "No results found",
  loadingText: "Loading",
};

export default class LmsPeoplePicker extends React.Component<ILmsPeoplePickerProps, ILmsPeoplePickerState> {
  private readonly _peopleservice: PeopleService = new PeopleService();
  private _peopleList: IPersonaProps[];
  private contextualMenuItems: IContextualMenuItem[] = [
    {
      key: "newItem",
      icon: "circlePlus",
      name: "New",
    },
    {
      key: "upload",
      icon: "upload",
      name: "Upload",
    },
    {
      key: "divider_1",
      name: "-",
    },
    {
      key: "rename",
      name: "Rename",
    },
    {
      key: "properties",
      name: "Properties",
    },
    {
      key: "disabled",
      name: "Disabled item",
      disabled: true,
    },
  ];

  constructor(props: ILmsPeoplePickerProps, context?: any) {
    super(props, context);
    this._peopleList = [];
    people.forEach((persona: IPersonaProps) => {
      const target: any = {};
      assign(target, persona, { menuItems: this.contextualMenuItems });
    });
    this.state = {
      selectedItems: [],
    };
  }

  public componentDidMount(): void {
    const { selectedUser } = this.props;
    this.setState({
      ...this.state,
      selectedItems: selectedUser,
    });
  }

  // public static getDerivedStateFromProps(nextProps: ILmsPeoplePickerProps, prevState: ILmsPeoplePickerState): ILmsPeoplePickerState {
  //   const { selectedUser } = prevState;
  //   let shouldSetState: boolean = false;
  //   if ((selectedUser.length !== 0 && prevState.selectedItems.length === 0)
  //     || (selectedUser.length === 0 && prevState.selectedItems.length !== 0)) {
  //     shouldSetState = true;
  //   } else {
  //     // for single user
  //     if (selectedUser.length !== 0 && prevState.selectedItems.length !== 0) {
  //       shouldSetState = selectedUser[0].tertiaryText.toLowerCase() !== prevState.selectedItems[0].tertiaryText.toLocaleLowerCase();
  //     }
  //   }
  //   if (shouldSetState) {
  //     return ({
  //       selectedItems: selectedUser,
  //     }) as ILmsPeoplePickerState;
  //   }
  //   return null;
  // }

  public componentWillReceiveProps(nextProps: ILmsPeoplePickerProps): void {
    const { selectedUser } = nextProps;
    let shouldSetState: boolean = false;
    if ((selectedUser.length !== 0 && this.state.selectedItems.length === 0)
      || (selectedUser.length === 0 && this.state.selectedItems.length !== 0)) {
      shouldSetState = true;
    } else {
      // for single user
      if (selectedUser.length !== 0 && this.state.selectedItems.length !== 0) {
        shouldSetState = selectedUser[0].tertiaryText.toLowerCase() !== this.state.selectedItems[0].tertiaryText.toLocaleLowerCase();
      }
    }
    if (shouldSetState) {
      this.setState({
        ...this.state,
        selectedItems: selectedUser,
      });
    }
  }

  public render(): React.ReactElement<ILmsPeoplePickerProps> {
    return (
      <div className={styles.lmspicker} >
        <div className={styles.lmspickerWrapper}>
          {/* <Label className={styles.lmspicker - label}>Drafter</Label> */}
          {this.props.label && (
            <Label className={styles.lmspickerLabel}>{this.props.label}</Label>
          )}
          <div className={styles.lmspickerFieldGroup}>
            <CompactPeoplePicker
              disabled={this.props.disabled}
              onResolveSuggestions={this._onFilterChanged}
              getTextFromItem={(persona: IPersonaProps) => persona.primaryText}
              pickerSuggestionsProps={suggestionProps}
              className={"ms-PeoplePicker " + styles.lmsPeoplePicker}
              itemLimit={1}
              key={"normal"}
              selectedItems={this.state.selectedItems}
              onChange={this._onchange}
            />
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _onFilterChanged(filterText: string, currentPersonas: IPersonaProps[], limitResults?: number):
    IPersonaProps[] | Promise<IPersonaProps[]> {
    if (filterText) {
      if (filterText.length > 2) {
        return this._searchPeople(filterText, this._peopleList);
      }
    } else {
      return [];
    }
  }

  @autobind
  private _onchange(items?: IPersonaProps[]): void {
    if (!McsUtil.isArray(items) && items.length < 1) {
      items = [];
    }
    if (McsUtil.isFunction(this.props.onchange)) {
      if (items.length > 0) {
        const alluserPromise: Array<Promise<SiteUserProps>> = items.map((value) => {
          return this._peopleservice.ensureUser(value.tertiaryText);
        });
        Promise.all(alluserPromise)
          .then((value: SiteUserProps[]) => {
            this.props.onchange(value, items);
          });
      } else {
        this.props.onchange([], []);
      }
    }
    this.setState({ ...this.state, selectedItems: items });
  }

  /**
   * @function
   * Returns people results after a REST API call
   */
  private _searchPeople(terms: string, results: IPersonaProps[]): IPersonaProps[] | Promise<IPersonaProps[]> {
    // return new Promise<IPersonaProps[]>((resolve, reject) => setTimeout(() => resolve(results), 2000));
    if (this.props.isLocalEnvironment) {
      // if the running environment is local, load the data from the mock
      return mockPeoplePickerList;
    } else {
      let principalType: number = 0;
      if (this.props.principalTypeUser === true) {
        principalType += 1;
      }
      // if (this.props.principalTypeSharePointGroup === true) {
      //   principalType += 8;
      // }
      // if (this.props.principalTypeSecurityGroup === true) {
      //   principalType += 4;
      // }
      // if (this.props.principalTypeDistributionList === true) {
      //   principalType += 2;
      // }
      return this._peopleservice.searchPeople(this.props.spHttpClient, principalType, terms);
    }
  }
}
// tslint:disable-next-line:max-line-length
// http://dattabase.com/sharepoint-people-picker-rest-api/