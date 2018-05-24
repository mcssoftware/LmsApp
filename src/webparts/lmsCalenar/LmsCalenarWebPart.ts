import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
} from "@microsoft/sp-webpart-base";
import styles from "./LmsCalenarWebPart.module.scss";
import * as strings from "LmsCalenarWebPartStrings";
import { LmsCalendarService } from "./LmsCalendarService";
import { LmsCalendarOrder } from "./LmsCalendarOrder";
import { config, McsUtil, tokenProvider } from "mcs-lms-core";
import * as $ from "jquery";
// import { LmsCalendarExport } from "./LmsCalendarExport";
export interface ILmsCalenarWebPartProps {
  chamber: string;
}

export default class LmsCalenarWebPart extends BaseClientSideWebPart<ILmsCalenarWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    this.domElement.innerHTML = `
      <div class="${ styles.lmsCalenar}">
      <div class="orderSection">
        <div class=${styles.webpartheader}>
          <div class=${styles.row}>
             <span class=${styles.headerText}>${this.properties.chamber} Calendar</span>
          </div>
        </div>
       <div class="${styles.calendarOrder}">
         <div class="${styles.container}"></div>
        </div>
      </div>
      <div class="exportSection" style="display:none">
        <div class="${styles.webpartheader2}">
          <div class=${styles.row}>
              <span class=${styles.headerText}>Calendar Exports</span>
            </div>
          </div>
          <div class="${styles.container}">
          <div class="${styles.calendarExport}">
            <table class="${styles.table}">
              <thead>
                  <tr>
                      <th>Step #</th>
                      <th>Title</th>
                      <th>Consent</th>
                      <th></th>
                  </tr>
              </thead>
              <tbody></tbody>
            </table>
            <div class="form">
              <select id="selectedStep" name="Step"></select>
              <input id="selectedAction" name="Action" type="text" style="z-index:0;">
              <input id="consent" name="Consent" type="checkbox">
              <button id="addSection" type="button" disabled="disabled">Add</button>
            </div>
            <div class="manageReport">
              <button type="button" class="${styles.button}" id="saveBtn">Save</button>
              <button type="button" class="${styles.button}" id="previewBtn">Preview</button>
              <button type="button" class="${styles.button}" id="publishBtn">Publish</button>
              <button type="button" class="${styles.button}" id="clearBtn">Clear</button>
            </div>
          </div>
        </div>
        </div>
      </div>`;
    this._initialize();
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
                PropertyPaneDropdown("chamber", {
                  label: "Select a chamber",
                  options: this._getChambers(),
                }),
              ],
            },
          ],
        },
      ],
    };
  }

  private _initialize(): void {
    const isLocalEnvironment: boolean = (Environment.type === EnvironmentType.Test || Environment.type === EnvironmentType.Local);
    const $calendarContainer: JQuery<HTMLElement> = $("." + styles.calendarOrder, this.domElement);
    const $exportContainer: JQuery<HTMLElement> = $("." + styles.calendarExport, this.domElement);

    const service: LmsCalendarService = new LmsCalendarService(isLocalEnvironment, this.context.httpClient, () => tokenProvider.getToken(), this);
    const _builder: LmsCalendarOrder = new LmsCalendarOrder(service, this.properties.chamber, $calendarContainer, $exportContainer);
  }

  private _getChambers(): IPropertyPaneDropdownOption[] {
    // key needs to match list title
    return [
      { key: "House", text: "House" },
      { key: "Senate", text: "Senate" },
    ];
  }
}
