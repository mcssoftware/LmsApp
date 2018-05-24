import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, EnvironmentType, Environment } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneDropdown,
  IPropertyPaneDropdownOption,
  PropertyPaneToggle,
} from "@microsoft/sp-webpart-base";

import * as strings from "CustomListViewWebPartStrings";
import CustomListView from "./components/CustomListView";
import { ICustomListViewProps } from "./components/ICustomListViewProps";
import { config, IField, McsUtil } from "mcs-lms-core";
import { get, update } from "@microsoft/sp-lodash-subset";
import { ListService } from "../../services/ListService";

export interface ICustomListViewWebPartProps {
  title: string;
  listId: string;
  viewId: string;
  filterType: string;
  filterField: string;
  allowMultipleSelection: boolean;
  showFilter: boolean;
  heightCss: string;
  canAddItem: boolean;
}

export default class CustomListViewWebPart extends BaseClientSideWebPart<ICustomListViewWebPartProps> {
  private _cachedLists: IPropertyPaneDropdownOption[] = null;
  private _cachedViews: IPropertyPaneDropdownOption[] = null;
  private _cachedFields: IField[] = null;
  private _listDropdownDisabled: boolean = false;
  private _viewDropdownDisabled: boolean = false;

  public render(): void {
    if (this.context) {
      config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    }
    const element: React.ReactElement<ICustomListViewProps> = React.createElement(
      CustomListView,
      {
        title: this.properties.title,
        webUrl: this.context && this.context.pageContext ? this.context.pageContext.web.absoluteUrl : "",
        listId: this.properties.listId,
        viewId: this.properties.viewId,
        filterType: this.properties.filterType,
        filterField: this.properties.filterField,
        showFilter: this.properties.showFilter,
        heightCss: this.properties.heightCss,
        canAddItem: this.properties.canAddItem,
      },
    );

    ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected onPropertyPaneConfigurationStart(): void {
    this._listDropdownDisabled = !this._cachedLists;
    this._viewDropdownDisabled = this._listDropdownDisabled || !this._cachedViews;

    if (this._cachedLists) {
      return;
    }

    this.context.statusRenderer.displayLoadingIndicator(this.domElement, "Lists");
    this._loadLists().then((listOptions: IPropertyPaneDropdownOption[]): Promise<IPropertyPaneDropdownOption[]> => {
      this._cachedLists = listOptions;
      this._listDropdownDisabled = false;
      this.context.propertyPane.refresh();
      this.context.statusRenderer.clearLoadingIndicator(this.domElement);
      return this._loadViews();
    })
      .then((viewOptions: IPropertyPaneDropdownOption[]): void => {
        this._cachedViews = viewOptions;
        this._viewDropdownDisabled = !this.properties.listId;
        this.context.propertyPane.refresh();
        this.context.statusRenderer.clearLoadingIndicator(this.domElement);
        this.render();
      });
  }

  protected get disableReactivePropertyChanges(): boolean {
    return true;
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("title", {
                  label: strings.TitleLabel,
                }),
                PropertyPaneDropdown("listId", {
                  label: strings.ListLabel,
                  options: this._cachedLists,
                  disabled: this._listDropdownDisabled,
                }),
                PropertyPaneDropdown("viewId", {
                  label: strings.ViewLabel,
                  options: this._cachedViews,
                  disabled: this._viewDropdownDisabled,
                }),
                PropertyPaneDropdown("filterType", {
                  label: "Select Filter Type",
                  options: this._getFilterDropDownValue(),
                }),
                PropertyPaneToggle("allowMultipleSelection", {
                  label: "Allow multiple selection?",
                }),
                PropertyPaneToggle("showFilter", {
                  label: "Display filter area?",
                }),
                PropertyPaneToggle("canAddItem", {
                  label: "Display \"Add Item\"?",
                }),
                PropertyPaneDropdown("heightCss", {
                  label: strings.HeightLabel,
                  options: [{ key: "", text: "Default" },
                  { key: "viewPort30", text: "30%" },
                  { key: "viewPort60", text: "60%" },
                  { key: "viewPort90", text: "90%" },
                  ],
                }),
              ],
            },
          ],
        },
      ],
    };
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void {
    if (propertyPath === "listId" && newValue) {
      // push new list value
      super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
      // get previously selected view
      const previousView: string = this.properties.viewId;
      // reset selected item
      this.properties.viewId = undefined;
      // push new item value
      this.onPropertyPaneFieldChanged("viewId", previousView, this.properties.viewId);
      if (oldValue !== newValue) {
        this._cachedViews = null;
      }
      // disable item selector until new items are loaded
      this._viewDropdownDisabled = true;
      // refresh the item selector control by repainting the property pane
      this.context.propertyPane.refresh();
      // communicate loading items
      this.context.statusRenderer.displayLoadingIndicator(this.domElement, "view");

      this._loadViews()
        .then((viewOptions: IPropertyPaneDropdownOption[]): void => {
          // store items
          this._cachedViews = viewOptions;
          // enable item selector
          this._viewDropdownDisabled = false;
          // clear status indicator
          this.context.statusRenderer.clearLoadingIndicator(this.domElement);
          // re-render the web part as clearing the loading indicator removes the web part body
          this.render();
          // refresh the item selector control by repainting the property pane
          this.context.propertyPane.refresh();
        });
    }
    else {
      super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
      if (propertyPath === "filterType") {
        this._setFilterType(newValue);
      }
    }
  }

  private _setFilterType(newFilterType: string): void {
    if (McsUtil.isString(newFilterType)) {
      if (newFilterType === "Bills") {
        this._loadFields().then((fields) => {
          const filteredResult: IField[] = fields.filter((f) => {
            return !f.IsDependentLookup && (/billLookup/gi.test(f.InternalName) || /lsonumber/gi.test(f.InternalName));
          });
          if (filteredResult.length > 0) {
            const targetProperty: string = "filterField";
            const oldValue: string = this.properties[targetProperty];
            const newValue: string = filteredResult[0].InternalName;
            this.properties[targetProperty] = newValue;
            this.onPropertyPaneFieldChanged(targetProperty, oldValue, newValue);
            // NOTE: in local workbench onPropertyPaneFieldChanged method initiates re-render
            // in SharePoint environment we need to call re-render by ourselves
            if (Environment.type !== EnvironmentType.Local) {
              this.render();
            }
          }
        });

      }
    } else {
      super.onPropertyPaneFieldChanged("filterField", this.properties.filterType, "");
    }
  }

  private _loadLists(): Promise<IPropertyPaneDropdownOption[]> {
    return new Promise<IPropertyPaneDropdownOption[]>((resolve: (options: IPropertyPaneDropdownOption[]) => void, reject: (error: any) => void) => {
      if (Environment.type === EnvironmentType.Local) {
        resolve([{
          key: "sharedDocuments",
          text: "Shared Documents",
        },
        {
          key: "someList",
          text: "Some List",
        }]);
      } else if (Environment.type === EnvironmentType.SharePoint ||
        Environment.type === EnvironmentType.ClassicSharePoint) {
        try {
          if (!this._cachedLists) {
            return ListService.getListFromWeb(this.context.pageContext.web.absoluteUrl)
              .then((lists) => {
                this._cachedLists = lists.map((l) => ({ key: l.Id, text: l.Title } as IPropertyPaneDropdownOption));
                resolve(this._cachedLists);
              });
          } else {
            // using cached lists if available to avoid loading spinner every time property pane is refreshed
            return resolve(this._cachedLists);
          }
        } catch (error) {
          alert("Error on loading lists:" + error);
        }
      }
    });
  }

  private _loadViews(): Promise<IPropertyPaneDropdownOption[]> {
    return new Promise<IPropertyPaneDropdownOption[]>((resolve: (options: IPropertyPaneDropdownOption[]) => void, reject: (error: any) => void) => {
      if (typeof this.properties.listId === "undefined") {
        // resolve to empty options since no list has been selected
        return Promise.resolve();
      }
      if (Environment.type === EnvironmentType.Local) {
        resolve([{
          key: "view1",
          text: "View 1",
        },
        {
          key: "view2",
          text: "View 2",
        }]);
      } else if (Environment.type === EnvironmentType.SharePoint ||
        Environment.type === EnvironmentType.ClassicSharePoint) {
        try {
          if (!this._cachedViews) {
            return ListService.getListViews(this.context.pageContext.web.absoluteUrl, this.properties.listId)
              .then((lists) => {
                this._cachedViews = lists.map((l) => ({ key: l.id, text: l.title } as IPropertyPaneDropdownOption));
                resolve(this._cachedViews);
              });
          } else {
            // using cached lists if available to avoid loading spinner every time property pane is refreshed
            return resolve(this._cachedViews);
          }
        } catch (error) {
          alert("Error on loading views of list:" + error);
        }
      }
    });
  }

  private _loadFields(): Promise<IField[]> {
    return new Promise<IField[]>((resolve: (options: IField[]) => void, reject: (error: any) => void) => {
      if (typeof this.properties.listId === "undefined") {
        // resolve to empty options since no list has been selected
        reject("");
      }
      if (Environment.type === EnvironmentType.Local) {
        Promise.resolve();
      } else if (Environment.type === EnvironmentType.SharePoint ||
        Environment.type === EnvironmentType.ClassicSharePoint) {
        try {
          if (!this._cachedFields) {
            ListService.getListFields(this.context.pageContext.web.absoluteUrl, this.properties.listId, "Hidden eq false and TypeDisplayName ne 'Computed'")
              .then((fields) => {
                this._cachedFields = fields;
                resolve(this._cachedFields);
              });
          } else {
            // using cached lists if available to avoid loading spinner every time property pane is refreshed
            resolve(this._cachedFields);
          }
        } catch (error) {
          alert("Error on loading views of list:" + error);
        }
      }
    });
  }

  private _getFilterDropDownValue(): IPropertyPaneDropdownOption[] {
    // key needs to match list title
    return [
      { key: "", text: "Select Filter" },
      { key: "Bills", text: "Bill Filter" },
      { key: "Tasks", text: "Task Filter" },
      { key: "Amendments", text: "Amendment Filter" },
    ];
  }
}
