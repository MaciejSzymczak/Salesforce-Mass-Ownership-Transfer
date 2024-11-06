import {LightningElement} from 'lwc';
import executeQuery from '@salesforce/apex/BusinessTools.executeQuery';
import queueChangeOwnership from '@salesforce/apex/massUpdateClass.queueChangeOwnership';
import runBatch from '@salesforce/apex/massUpdateClass.runBatch';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import inactiveOwnerId from '@salesforce/label/c.InactiveOwnerId';
import inactiveOwnerName from '@salesforce/label/c.InactiveOwnerName';

const columns = [  
    { label: 'Object', fieldName: 'sObjectName__c' },  
    { label: 'Details', fieldName: 'Details__c' },
    { label: 'Error', fieldName: 'Error__c' },
    { label: 'Old Onwer', fieldName: 'PriorOwner__r_Name' },
    { label: 'New Owner', fieldName: 'Owner__r_Name' },
    { label: 'Priority', fieldName: 'Priority__c' },
];  

export default class LwcExampleComponent extends LightningElement {

inactiveOwnerId=inactiveOwnerId;
inactiveOwnerName=inactiveOwnerName;
transferToInactiveUser  = false;

columns = columns;
recordsInError = [];

fromOwnerId;
toOwnerId;
canTransfer = false;
transferInProgressFlag = false;

AccCnt =0;
OppCnt =0;
ConCnt =0;
TaskCnt=0;
LeadCnt=0;

AccCntTo =0;
OppCntTo =0;
ConCntTo =0;
TaskCntTo=0;
LeadCntTo=0;

inProgress =0;
inError    =0;
inErrorFlag=false;

connectedCallback() {
    this.refreshScreen();
    this.refreshScreenInLoop();
}

refreshScreen() {
    if (this.fromOwnerId != null) {
        executeQuery({ theQuery: "select Id from Account where OwnerId='"+this.fromOwnerId+"' limit 2000" }).then((result) => { this.AccCnt = result.length;});
        executeQuery({ theQuery: "select Id from Opportunity where IsClosed = false and OwnerId='"+this.fromOwnerId+"' limit 2000" }).then((result) => {this.OppCnt = result.length;});
        executeQuery({ theQuery: "select Id from Contact where OwnerId='"+this.fromOwnerId+"' limit 2000" }).then((result) => {this.ConCnt = result.length;});
        executeQuery({ theQuery: "select Id from Task where IsClosed = false and OwnerId='"+this.fromOwnerId+"' limit 2000" }).then((result) => {this.TaskCnt = result.length;});
        executeQuery({ theQuery: "select Id from Lead where IsConverted = false and OwnerId='"+this.fromOwnerId+"' limit 2000" }).then((result) => {this.LeadCnt = result.length;});
    }

    if (this.toOwnerId != null) {
        executeQuery({ theQuery: "select Id from Account where OwnerId='"+this.toOwnerId+"' limit 2000" }).then((result) => { this.AccCntTo = result.length;});
        executeQuery({ theQuery: "select Id from Opportunity where IsClosed = false and OwnerId='"+this.toOwnerId+"' limit 2000" }).then((result) => {this.OppCntTo = result.length;});
        executeQuery({ theQuery: "select Id from Contact where OwnerId='"+this.toOwnerId+"' limit 2000" }).then((result) => {this.ConCntTo = result.length;});
        executeQuery({ theQuery: "select Id from Task where IsClosed = false and OwnerId='"+this.toOwnerId+"' limit 2000" }).then((result) => {this.TaskCntTo = result.length;});
        executeQuery({ theQuery: "select Id from Lead where IsConverted = false and OwnerId='"+this.toOwnerId+"' limit 2000" }).then((result) => {this.LeadCntTo = result.length;});
    }

    executeQuery({ theQuery: "select Id from MassUpdate__c where Error__c = null limit 2000" }).then((result) => { this.inProgress = result.length;});
    executeQuery({ theQuery: "select Id from MassUpdate__c where Error__c !=null limit 2000" }).then((result) => { this.inError = result.length;});

    executeQuery({ theQuery: "select sObjectName__c, Details__c, Error__c, PriorOwner__r.Name, Owner__r.Name, Priority__c  from MassUpdate__c where Error__c !=null order by createdDate desc  limit 20" })
    .then((result) => 
    { 
        //flat the structure
        var index, len;
        for (index = 0, len = result.length; index < len; ++index) {
            result[index].PriorOwner__r_Name=result[index].PriorOwner__r.Name;
            result[index].Owner__r_Name=result[index].Owner__r.Name;
        }
        this.recordsInError = result;
    });

    this.inErrorFlag = this.inError>0;
    this.transferInProgressFlag = this.inProgress>0;
}

refreshScreenInLoop() {
    setTimeout(() => {
        this.refreshScreen();
        this.refreshScreenInLoop();
    }, 5000); 
    }    

    handleSelectedLookupFrom(event) {
    this.fromOwnerId = event.detail;
    this.canTransfer = this.fromOwnerId != null && this.toOwnerId != null;
    this.refreshScreen();
}

handleSelectedLookupTo(event) {
    this.toOwnerId = event.detail;
    this.canTransfer = this.fromOwnerId != null && this.toOwnerId != null;
    this.refreshScreen();
}

runBatchClick(event) {
    const evt = new ShowToastEvent({
        title: 'Info',
        message: 'I am trying to process records in error again, please wait..',
        variant: 'info',
        mode: 'dismissable'
    });
    this.dispatchEvent(evt);

    runBatch()
    .then((result) => {
        this.refreshScreen();
        //alert( JSON.stringify(result) );            
    })
    .catch(error => {
        alert( JSON.stringify(error) );
    });    
}

transferOnClick(event) {

    const tAcc = this.template.querySelector('[data-id="transferAcc"]');
    const tOpp = this.template.querySelector('[data-id="transferOpp"]');
    const tCon = this.template.querySelector('[data-id="transferCon"]');
    const tTask = this.template.querySelector('[data-id="transferTask"]');
    const tLead = this.template.querySelector('[data-id="transferLead"]');
    
    // Get their checked status
    const transferAcc = tAcc.checked;
    const transferOpp = tOpp.checked;
    const transferCon = tCon.checked;
    const transferTask = tTask.checked;
    const transferLead = tLead.checked;

    console.log(`Checkbox 1: ${transferAcc}`);
    console.log(`Checkbox 2: ${transferOpp}`);
    console.log(`Checkbox 3: ${transferCon}`);
    console.log(`Checkbox 4: ${transferTask}`);
    console.log(`Checkbox 5: ${transferLead}`);
    

    const evt = new ShowToastEvent({
        title: 'Info',
        message: 'Updating in progress, please wait..',
        variant: 'info',
        mode: 'dismissable'
    });
    this.dispatchEvent(evt);

    queueChangeOwnership({ fromUser: this.fromOwnerId, ToUser:this.toOwnerId, transferAcc: transferAcc, transferOpp: transferOpp, transferCon: transferCon, transferTask: transferTask, transferLead: transferLead })
    .then((result) => {
        this.refreshScreen();
        //alert( JSON.stringify(result) );            
    })
    .catch(error => {
        alert( JSON.stringify(error) );
    });    
}

handleCheckboxChange(event) { 
    this.transferToInactiveUser = event.target.checked;
    if (this.transferToInactiveUser) {
        this.toOwnerId = this.inactiveOwnerId;
        this.canTransfer = this.fromOwnerId != null && this.toOwnerId != null;
        this.refreshScreen();
    }
}


}