import * as $ from "jquery";
import "jqueryui";
import { SPComponentLoader } from "@microsoft/sp-loader";
import { ICalendarOrder, ITaskUpdate } from "./ICalendarOrder";
import { LmsCalendarService } from "../../webparts/lmsCalenar/LmsCalendarService";
import { config, IList, McsUtil, IWorkflowDefinition, ITasks } from "mcs-lms-core";
import styles from "./LmsCalenarWebPart.module.scss";
import { HttpClient } from "@microsoft/sp-http";
import { ListService } from "../../services/ListService";

interface IRowData {
    Step: number;
    EntityType: string;
    Id: number;
    SortIndex: number;
}

export class LmsCalendarOrder {
    private static _sectionDataName: string = "CalendarOrder";
    private static _itemDataName: string = "item";
    private _dropped: boolean = false;
    private _pageSize: number = 50;
    private _chamber: string;
    private _$orderContainer: JQuery<HTMLElement>;
    private _$orderSection: JQuery<HTMLElement>;
    private _$manageContainer: JQuery<HTMLElement>;
    private _listProperties: IList;

    constructor(private _service: LmsCalendarService, chamber: string, $orderContainer: JQuery<HTMLElement>, $manageContainer: JQuery<HTMLElement>) {
        SPComponentLoader.loadCss("https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.min.css");
        this._chamber = McsUtil.isString(chamber) ? chamber : "House";
        this._$orderContainer = $orderContainer;
        this._$orderSection = $orderContainer.find("." + styles.container);
        this._$manageContainer = $manageContainer;
        this.initializeOrderSection().then(() => {
            this._createDragAndDrop();
        });
    }

    public initializeOrderSection(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Promise.all([this._service.getWorkflowSteps(this._chamber),
            this._service.getListProperties(),
            this._service.getAllWorkflowSteps(this._chamber)])
                .then((responses) => {
                    const steps: ICalendarOrder[] = responses[0];
                    this._listProperties = responses[1];
                    const allWorkflowSteps: IWorkflowDefinition[] = responses[2];
                    this.initializeManageSection(allWorkflowSteps);
                    steps.forEach((calendarOrder) => {
                        this._insertSection(calendarOrder);
                    });
                    this._service.getTasks(steps).then((tasks) => {
                        tasks.map((task, i) => {
                            this._addItemsToSection(parseInt(task.WorkflowStepNumber.toString(), 10), task);
                        });
                        resolve();
                    });
                }, (error) => { this._handleError(error); });
        });
    }

    public initializeManageSection(allWorkflowSteps: IWorkflowDefinition[]): void {
        this._$manageContainer.closest(".exportSection").show();
        const $select: JQuery = $(".form select", this._$manageContainer);
        const $selectedText: JQuery = $(".form #selectedAction", this._$manageContainer);
        const $addButton: JQuery = $(".form #addSection", this._$manageContainer);

        $("option", $select).remove();
        let stepOptions: string = this._getDropdownOption("", "Select an option");
        allWorkflowSteps.map((step) => {
            stepOptions += this._getDropdownOption(step.Step.toString(), step.StepTitle);
        });
        $select.append(stepOptions);
        $select.val("");

        const $tbody: JQuery = $(`.${styles.table} tbody`, this._$manageContainer);
        $tbody.on("click", (event) => {
            const $clickedObject: JQuery = $(event.target);
            if ($clickedObject.hasClass("sectionDelete")) {
                const $row: JQuery = $clickedObject.closest("tr");
                const calendarOrderData: ICalendarOrder = $row.data(LmsCalendarOrder._sectionDataName);
                this._service.delete(calendarOrderData);
                $row.remove();
                // delete section from ordering
                const panelToDelete: JQuery<HTMLElement> = $("div[class^='panel_']." + calendarOrderData.Step, this._$orderSection);
                if (panelToDelete.length > 1) {
                    panelToDelete.each((index, ele) => {
                        const panelData: ICalendarOrder = $(ele).data(LmsCalendarOrder._sectionDataName) as ICalendarOrder;
                    });
                }
            }
        });

        $select.on("change", () => {
            const $selectedOption: JQuery = $("option:selected", $select);
            if (McsUtil.isString($selectedOption.val())) {
                $selectedText.val($selectedOption.text());
            } else {
                $selectedText.val("");
            }
            $selectedText.trigger("change");
        });

        $selectedText.on("change", () => {
            const $selectedOption: JQuery = $("option:selected", $select);
            if (McsUtil.isString($selectedText.val()) && McsUtil.isString($selectedOption.val())) {
                $addButton.removeAttr("disabled");
            } else {
                $addButton.attr("disabled", "disabled");
            }
        });

        $addButton.on("click", (event) => {
            const $selectedOption: JQuery = $("option:selected", $select);
            const $consentItem: JQuery = $(".form #consent", this._$manageContainer);
            const isChecked: boolean = $consentItem.is(":checked");
            let temp: ICalendarOrder = {
                Chamber: this._chamber,
                IsConsent: isChecked,
                Modified: new Date(),
                Name: $selectedText.val(),
                Step: parseInt($selectedOption.val() as string, 10),
                UserDefined: true,
                SortIndex: 0,
                Items: "",
            } as ICalendarOrder;
            temp = this._service.add(temp);
            this._insertSection(temp);
            this._createDragAndDrop();
            $select.val("");
            if (isChecked) {
                $consentItem.trigger("click");
            }
        });

        $("#saveBtn", this._$manageContainer).on("click", () => {
            this._saveSection();
        });
    }

    private _getDropdownOption(value: string, text: string): string {
        return (`<option value="${value}">${text}</option>`);
    }

    private _insertSection(calendarOrder: ICalendarOrder): void {
        this._$orderSection.append(this._getSectionPanel(calendarOrder));
        if (calendarOrder.UserDefined) {
            const row: JQuery<HTMLElement> = $(`<tr>
            <td>${calendarOrder.Step}</td>
            <td>${calendarOrder.Name}</td>
            <td>${calendarOrder.IsConsent}</td>
            <td><button type="button" class="sectionDelete">Delete</button></td>
            </tr>`);
            row.data(LmsCalendarOrder._sectionDataName, calendarOrder);
            $("tbody", this._$manageContainer).append(row);
        }
    }

    private _getSectionPanel(calendarOrder: ICalendarOrder): JQuery<HTMLElement> {
        const $collapseBtn: JQuery<HTMLElement> = $(`<a class="${styles.collapseBtn}" data-collapsed="false">v</a>`);
        const $section: JQuery<HTMLElement> = $(`<div class="${styles.panel} ${styles.panelDefault} ${calendarOrder.Step}">
        <div class="${styles.panelHeading}"><h3>${calendarOrder.Name}<input type="checkbox"/></h3></div>
        <div class="${styles.panelBody}">
            <table class="${styles.table} table-hover">
                <thead>
                    <tr>
                        <th></th>
                        <th>Bill Number</th>
                        <th>Catch Title</th>
                        <th>Sponsor</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody class="table-bordered"></tbody>
            </table>
        </div>
        </div>`);
        const $header: JQuery<HTMLElement> = $section.find(`.${styles.panelHeading} h3`);
        $section.data(LmsCalendarOrder._sectionDataName, calendarOrder);
        $header.append($collapseBtn);
        $header.append();
        const $body: JQuery<HTMLElement> = $section.find(`.${styles.panelBody}`);
        $($collapseBtn).click((ev) => {
            const collapsed: boolean = $(ev.currentTarget).data("collapsed");
            if (collapsed) {
                $(ev.currentTarget).data("collapsed", false);
                $body.show();
            } else {
                $(ev.currentTarget).data("collapsed", true);
                $body.hide();
            }
        });
        return $section;
    }

    private _createDragAndDrop(): void {
        this._$orderSection.not(".ui-sortable").sortable({
            axis: "y",
            placeholder: "ui-state-highlight",
            start: (event, ui) => {
                //
            },
            stop: (event, ui) => {
                //
            },
        });
        $("tbody:not(.ui-sortable)", this._$orderSection).sortable({
            start: (event, ui) => {
                this._dropped = false;
            },
            stop: (event, ui) => {
                this._dropped = true;
            },
        }).droppable({
            hoverClass: "ui-state-active",
            accept: "tr",
            drop: (event, ui) => {
                if (!this._dropped) {
                    const $startSection: JQuery = $(ui.helper).closest("div[class^='panel_']");
                    const $dropSection: JQuery = $(ui.draggable).closest("div[class^='panel_']");
                    const startData: ICalendarOrder = $startSection.data(LmsCalendarOrder._sectionDataName);
                    const dropData: ICalendarOrder = $dropSection.data(LmsCalendarOrder._sectionDataName);
                    if (dropData.Step === startData.Step && dropData.SortIndex !== startData.SortIndex) {
                        const moving: JQuery<HTMLElement> = ui.helper.clone();
                        moving.removeAttr("style");
                        // const uiParent: JQuery<HTMLElement> = ui.helper.parent();
                        ui.helper.remove();
                        $("div[class^='panelBody_'] tbody", $dropSection).append(moving);
                        this._dropped = true;
                    }
                }
            },
        });
        $("[class^='panelBody_']:not(.ui-droppable)", this._$orderSection).droppable({
            hoverClass: "ui-state-active",
            accept: "tr",
            drop: (event: Event, ui: JQueryUI.DroppableEventUIParam) => {
                if (!this._dropped) {
                    const h1: JQuery<HTMLElement> = ui.helper;
                    const $startSection: JQuery = $(ui.helper).closest("div[class^='panel_']");
                    const startData: ICalendarOrder = $startSection.data(LmsCalendarOrder._sectionDataName);
                    const $dropSection: JQuery = $(event.target).closest("div[class^='panel_']");
                    const dropData: ICalendarOrder = $dropSection.data(LmsCalendarOrder._sectionDataName);
                    if (dropData.Step === startData.Step && dropData.SortIndex !== startData.SortIndex) {
                        const moving: JQuery<HTMLElement> = ui.helper.clone();
                        moving.removeAttr("style");
                        // const uiParent: JQuery<HTMLElement> = ui.helper.parent();
                        ui.helper.remove();
                        $("div[class^='panelBody_'] tbody", $dropSection).append(moving);
                        this._dropped = true;
                    }
                }
            },
        });

    }

    private _getSectionValues(): ICalendarOrder[] {
        if (this._chamber == null) { return null; }
        const billNumberIndex: number = 1;
        const valuesToSave: ICalendarOrder[] = [];
        const sections: any = this._$orderContainer.children(`.${styles.panel} tbody`).sortable();
        return valuesToSave;
    }

    private _addItemsToSection(workflowStep: number, item: ITasks): void {
        let panels: JQuery<HTMLElement> = $("div[class^='panel_']." + workflowStep, this._$orderSection);
        if (panels.length > 1) {
            const sectionNumber: number = Math.floor((item.CalendarOrder) / 100);
            let found: boolean = false;
            panels.each((index: number, p: HTMLElement) => {
                const stepData: ICalendarOrder = $(p).data(LmsCalendarOrder._sectionDataName) as ICalendarOrder;
                if (sectionNumber === stepData.SortIndex) {
                    panels = $(p);
                    found = true;
                    return false;
                }
            });
            if (!found) {
                panels = panels.last();
            }
        }

        const url: string = ListService.getLinkUrl(config.getLmsUrl(), this._listProperties.Title, this._listProperties.Id, item);

        const rowToAdd: JQuery<HTMLElement> = $(`<tr>
            <td><a href="${url}">Edit</a></td>
            <td data-billid="${item.BillLookupId}">${item.BillLookup.BillNumber}</td>
            <td>${item.BillLookup.CatchTitle}</td>
            <td>${item.BillLookup.Sponsor}</td>
            <td>${item.Created}</td>
            </tr>`);
        rowToAdd.data(LmsCalendarOrder._itemDataName, {
            Step: workflowStep,
            EntityType: item["odata.type"],
            Id: item.Id,
            SortIndex: item.CalendarOrder,
        } as IRowData);
        panels.find("tbody").append(rowToAdd);
    }

    private _handleError(error: string): void {
        // tslint:disable-next-line:no-console
        console.log(error);
    }

    private _saveSection(): void {
        const itemsToSave: ITaskUpdate[] = [];
        const sectionToSave: ICalendarOrder[] = [];
        const modifiedDate: Date = new Date(Date.now());
        $("div[class^='panel_']", this._$orderSection)
            .each((sectionIndex, ele) => {
                const selectionData: ICalendarOrder = $(ele).data(LmsCalendarOrder._sectionDataName) as ICalendarOrder;
                selectionData.SortIndex = sectionIndex + 1;
                selectionData.Modified = modifiedDate;
                sectionToSave.push(selectionData);
                $("div[class^='panelBody_'] table tbody tr", $(ele))
                    .each((index, row) => {
                        const rowData: IRowData = $(row).data(LmsCalendarOrder._itemDataName);
                        const newSortIndex: number = (selectionData.SortIndex * 100) + (index + 1);
                        if (newSortIndex !== rowData.SortIndex) {
                            itemsToSave.push({
                                Id: rowData.Id,
                                EntityType: rowData.EntityType,
                                properties: {
                                    CalendarOrder: newSortIndex,
                                },
                            });
                        }
                    });
            });
        this._service.saveChanges(sectionToSave, itemsToSave).then(() => {
            window.location.reload();
        });
    }
}