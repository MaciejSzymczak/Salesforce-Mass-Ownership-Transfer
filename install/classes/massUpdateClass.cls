public without sharing class massUpdateClass implements Database.Batchable<sObject>  {
    
    /*
* Used by LWC component massUpdate
* @author Maciej Szymczak 
* @version 2024.08.20
*/
    
    @AuraEnabled
    public static void queueChangeOwnership(Id fromUser, Id ToUser, Boolean transferAcc, Boolean transferOpp, Boolean transferCon, Boolean transferTask, Boolean transferLead) {
        Account[]     accounts = [select Id from Account     where ownerId = :fromUser];
        Opportunity[] opps     = [select Id from Opportunity where ownerId = :fromUser and isClosed = false];
        Contact[]     contacts = [select Id from Contact     where ownerId = :fromUser];
        Task[]        tasks    = [select Id from Task        where ownerId = :fromUser and isClosed = false];
        Lead[   ]     leads    = [select Id from Lead        where ownerId = :fromUser and isConverted = false];
        
        MassUpdate__c[] toInsert = new List<MassUpdate__c>();        
        if (transferAcc)  for (Account     rec : accounts) { toInsert.add(new MassUpdate__c(Account__c     = rec.Id, Owner__c = toUser, PriorOwner__c=fromUser)); }
        if (transferOpp)  for (Opportunity rec : opps)     { toInsert.add(new MassUpdate__c(Opportunity__c = rec.Id, Owner__c = toUser, PriorOwner__c=fromUser)); }
        if (transferCon)  for (Contact     rec : contacts) { toInsert.add(new MassUpdate__c(Contact__c     = rec.Id, Owner__c = toUser, PriorOwner__c=fromUser)); }
        if (transferTask) for (Task        rec : tasks)    { toInsert.add(new MassUpdate__c(Task__c        = rec.Id, Owner__c = toUser, PriorOwner__c=fromUser)); }
        if (transferLead) for (Lead        rec : leads)    { toInsert.add(new MassUpdate__c(Lead__c        = rec.Id, Owner__c = toUser, PriorOwner__c=fromUser)); }
        insert toInsert;
        runBatch ();
    }
    
    @AuraEnabled
    public static void runBatch () {
        Database.executeBatch(new massUpdateClass(), 5);            
    }
    
    public String query = 'select Id, sObjectId__c, sObjectName__c, Owner__c,Priority__c from MassUpdate__c order by Priority__c, createdDate, sObjectName__c';
    
    Public  Database.QueryLocator start(Database.BatchableContext BC){
        return Database.getQueryLocator(query);
    }
    Public  void execute(Database.BatchableContext BC, List<sObject> scope){
        process(scope);    
    }
    Public  void finish(Database.BatchableContext BC){}
    
    public static void process (MassUpdate__c[] toProcess) {
        try {
            Set<SObject>  obj = new Set<SObject>(); 
            for (MassUpdate__c mu :toProcess) {
                sObject sObj = Schema.getGlobalDescribe().get(mu.sObjectName__c).newSObject() ;
                sObj.put('Id', mu.sObjectId__c);
                sObj.put('OwnerId', mu.Owner__c);
                obj.add(sObj);
            }
            if (obj.size()>0) update new List<SObject>(obj); 
            delete toProcess;
        } catch (Exception e) {
            for (MassUpdate__c mu : toProcess) { 
                //degregate priority so that bad record is not blocking other records
                mu.Priority__c = mu.Priority__c + 1;
                String errorMessage=e.getMessage()+''+' Cause:'+e.getCause()+' Line:'+e.getLineNumber();
                if(errorMessage.length() > 250 ){errorMessage = errorMessage.substring(0, 250);}                
                mu.Error__c = errorMessage; }
            update toProcess;
        }
        
    }
    
}