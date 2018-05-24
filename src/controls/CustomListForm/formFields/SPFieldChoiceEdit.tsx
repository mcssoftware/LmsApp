import * as React from "react";
import { ISPFormFieldProps } from "./SPFormField";
import { Dropdown, IDropdownProps, IDropdownOption, css } from "office-ui-fabric-react";

import styles from "./SPFormField.module.scss";

// tslint:disable-next-line:variable-name
const SPFieldChoiceEdit: React.SFC<ISPFormFieldProps> = (props) => {
    if (props.fieldSchema.FieldType !== "MultiChoice") {
        const options: any[] = (props.fieldSchema.Required) ? props.fieldSchema.Choices : [""].concat(props.fieldSchema.Choices);
        return <Dropdown
            className={css(styles.dropDownFormField, "ard-choiceFormField")}
            options={options.map((option: string) => ({ key: option, text: option }))}
            selectedKey={props.value}
            onChanged={(item) => props.valueChanged(item.key.toString())}
        />;
    } else {
        const options: any = props.fieldSchema.MultiChoices;
        const values: string[] = props.value ? props.value.split(";#").filter((s) => s) : [];
        return <Dropdown
            title={JSON.stringify(props.fieldSchema) + props.value}
            className={css(styles.dropDownFormField, "ard-multiChoiceFormField")}
            options={options.map((option: string) => ({ key: option, text: option }))}
            selectedKeys={values}
            multiSelect
            onChanged={(item) => props.valueChanged(getUpdatedValue(values, item))}
        />;
    }
};

function getUpdatedValue(oldValues: string[], changedItem: IDropdownOption): string {
    const changedKey: string = changedItem.key.toString();
    const newValues: string[] = [...oldValues];
    if (changedItem.selected) {
        // add option if it's checked
        if (newValues.indexOf(changedKey) < 0) { newValues.push(changedKey); }
    } else {
        // remove the option if it's unchecked
        const currIndex: number = newValues.indexOf(changedKey);
        if (currIndex > -1) { newValues.splice(currIndex, 1); }
    }
    return newValues.join(";#");
}

export default SPFieldChoiceEdit;
