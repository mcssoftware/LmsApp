import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from "@microsoft/sp-webpart-base";

import * as strings from "DraftingFolderWebPartStrings";
import DraftingFolder from "./components/DraftingFolder";
import { IDraftingFolderProps } from "./components/IDraftingFolderProps";
import { config, IList, IListSelection } from "mcs-lms-core";
import { get, update } from "@microsoft/sp-lodash-subset";
import { PropertyPaneListSelect } from "../../controls/PropertyPaneListSelect/PropertyPaneListSelect";
import { ListService } from "../../services/ListService";

export interface IDraftingFolderWebPartProps {
  title: string;
  lists: IListSelection[];
  allowNewBillVersion: boolean;
}

export default class DraftingFolderWebPart extends BaseClientSideWebPart<IDraftingFolderWebPartProps> {
  private _cachedLists: IList[];

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const webUrl: string = Environment.type === EnvironmentType.Local ? "" : this.context.pageContext.web.absoluteUrl;
    const element: React.ReactElement<IDraftingFolderProps> = React.createElement(
      DraftingFolder,
      {
        title: this.properties.title,
        lists: this.properties.lists,
        webUrl,
        httpClient: this.context.httpClient,
        isLocalEnvironment: (Environment.type === EnvironmentType.Test || Environment.type === EnvironmentType.Local),
        canCreateNewVersion: this.properties.allowNewBillVersion,
      },
    );

    ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
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
                  label: strings.WebPartTitleLabel,
                }),
                new PropertyPaneListSelect("lists", {
                  label: strings.ListsLabel,
                  loadOptions: this._loadLists.bind(this),
                  onPropertyChange: this._onListSelectionChanged.bind(this),
                  selectedKey: this.properties.lists,
                }),
                PropertyPaneToggle("allowNewBillVersion", {
                  label: "Alow version creation of bill?",
                }),
              ],
            },
          ],
        },
      ],
    };
  }

  private _loadLists(): Promise<IList[]> {
    return new Promise<IList[]>((resolve: (options: IList[]) => void, reject: (error: any) => void) => {
      if (Environment.type === EnvironmentType.Local) {
        resolve([]);
      } else if (Environment.type === EnvironmentType.SharePoint ||
        Environment.type === EnvironmentType.ClassicSharePoint) {
        try {
          if (!this._cachedLists) {
            return ListService.getLsoLists(this.context.pageContext.web.absoluteUrl)
              .then((lists) => {
                this._cachedLists = lists.concat(ListService.getMockFiscalList());
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

  private _onListSelectionChanged(propertyPath: string, newValue: any): void {
    const oldValue: any = get(this.properties, propertyPath);
    // store new value in web part properties
    update(this.properties, propertyPath, (): any => newValue);
    // refresh web part
    this.render();
  }
}
