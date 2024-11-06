import { LightningElement, api } from 'lwc';

export default class LwcLookupComponent extends LightningElement {

    @api name;
    @api variant = "label-hidden";
    @api hideLabel = false;
    @api fieldLabel;
    @api childObjectApiName;
    @api targetFieldApiName;
    @api value;
    @api required = false;
    @api addToRecent = false;

    handleChange(event) {
        let selectedEvent = new CustomEvent('valueselected', {detail: event.detail.value[0]});
        this.dispatchEvent(selectedEvent);
    }

    @api reportValidity() {
        if(this.required) {
            this.template.querySelector('lightning-input-field').reportValidity();
        }
    }

}