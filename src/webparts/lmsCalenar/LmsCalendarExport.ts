// import { LmsCalendarService } from "./LmsCalendarService";
// import { HttpClient } from "@microsoft/sp-http";
// import { ICalendarOrder } from "./ICalendarOrder";
// import { McsUtil } from "../../libraries/util";
// import * as $ from "jquery";
// import styles from "./LmsCalenarWebPart.module.scss";
// import { IStepInfo } from "./LmsCalendarService";
// import { IWorkflowDefinition } from "../../interfaces";

// interface ICalendarExportForm {
//     SelectedStep: JQuery<HTMLElement>;
//     SelectedAction: JQuery<HTMLElement>;
//     Consent: JQuery<HTMLElement>;
//     AddButton: JQuery<HTMLElement>;
// }

// export class LmsCalendarExport {
//     private _chamber: string;
//     private _form: ICalendarExportForm;
//     private _steps: IWorkflowDefinition[];
//     constructor(private _service: LmsCalendarService, private _container: JQuery<HTMLElement>, chamber: string) {
//         this._chamber = (McsUtil.isString(chamber)) ? chamber : "House";
//         this._initialize();
//     }

//     private _initialize(): void {
//         this._getSteps().then(() => {
//             this._container.append(this._getFormSection());
//             this._form = {
//                 SelectedAction: $("#selectedAction"),
//                 SelectedStep: $("#selectedStep"),
//                 Consent: $("#consent"),
//                 AddButton: $("#addSection"),
//             };
//             const stepsOption: JQuery<HTMLElement> = $("#selectedStep");
//             stepsOption.append(this._getDropdownOption("", "Select an option"));
//             this._steps.map((step) => {
//                 stepsOption.append(this._getDropdownOption(step.Id.toString(), step.StepTitle));
//             });
//             const addButton: JQuery<HTMLElement> = $("#addSection");
//             const that: any = this;
//             addButton.click(() => { that._addCalendar(that); });
//             this._manageData();
//         });
//     }

//     private _getDropdownOption(value: string, text: string): JQuery<HTMLElement> {
//         return $(`<option value="${value}">${text}</option>`);
//     }

//     private _getSteps(): Promise<void> {
//         return new Promise<void>((resolve, reject) => {
//             this._service.getAllWorkflowSteps(this._chamber).then((steps: IWorkflowDefinition[]) => {
//                 this._steps = steps;
//                 resolve();
//             });
//         });
//     }

//     private _getFormSection(): JQuery<HTMLElement> {
//         const $form: JQuery<HTMLElement> = $(`<table id="sectionstable" class="${styles.table}">
//         <thead>
//             <tr>
//                 <th>Step #</th>
//                 <th>Title</th>
//                 <th>Consent</th>
//                 <th></th>
//             </tr>
//         </thead>
//         <tbody></tbody>
//     </table>
//     <form>
//     <select id="selectedStep" name="Step">
//     </select>
//     <input id="selectedAction" name="Action" type="text" style="z-index:0;">
//     <input id="consent" name="Consent" type="checkbox">
//     <button id="addSection" type="button">Add</button>
//     </form>
//     `);
//         return $form;
//     }

//     private _addCalendar(context: any): void {
//         const temp: ICalendarOrder = {
//             Chamber: context._chamber,
//             IsConsent: context._form.Consent.is(":checked"),
//             Modified: new Date(),
//             Name: McsUtil.isString(context._form.SelectedAction.val()) ? context._form.SelectedAction.val().toString() : "",
//             Step: McsUtil.isString(context._form.SelectedStep.val()) ? parseInt(context._form.SelectedStep.val().toString(), 10) : 0,
//             UserDefined: true,
//             Items: "",
//         } as ICalendarOrder;
//         temp.SortIndex = temp.Step + 1;
//         this._service.add(temp);
//         this._manageData();
//     }

//     private _deleteCalendar(data: ICalendarOrder): void {
//         this._service.delete(data);
//         this._manageData();
//     }

//     private _manageData(): void {
//         // const tbody: JQuery<HTMLElement> = $("#sectionstable tbody");
//         const tbody: JQuery<HTMLElement> = $("#sectionstable tbody");
//         tbody.children("tr").remove();
//         this._service.getCalendarOrders().then((calendars) => {
//             calendars.map((result) => {
//                 const row: JQuery<HTMLElement> = $(`<tr>
//             <td>${result.Step}</td>
//             <td>${result.Name}</td>
//             <td>${result.IsConsent}</td>
//             <td><button type="button" id="del${result.Id}">Delete</button></td>
//             </tr>`);
//                 row.data("id", result.Id);
//                 tbody.append(row);
//                 const delButton: JQuery<HTMLElement> = $(`#del${result.Id}`);
//                 delButton.click(() => { this._deleteCalendar(result); });
//             });
//         });
//         // if (McsUtil.isDefined(data)) {
//         //     if (add) {
//         //         data.Id = this._allData.length + 1;
//         //         this._allData.push(data);
//         //         const row: JQuery<HTMLElement> = $(`<tr>
//         //         <td>${data.Step}</td>
//         //         <td>${data.Name}</td>
//         //         <td>${data.IsConsent}</td>
//         //         <td><button id="del${this._allData.length}">Delete</button></td>
//         //         </tr>`);
//         //         row.data("id", data.Id);
//         //         tbody.append(row);
//         //         const delButton: JQuery<HTMLElement> = $(`#del${this._allData.length}`);
//         //         delButton.click(() => { this._deleteCalendar(data); });
//         //     } else {
//         //         this._allData.splice(this._allData.indexOf(data), 1);
//         //         tbody.children("tr").each((index, row) => {
//         //             const trow: JQuery<HTMLElement> = $(row);
//         //             if (trow.data("id") === data.Id) {
//         //                 trow.remove();
//         //             }
//         //         });
//         //     }
//     }
// }