@isTest
public class massUpdateClassTest {

    public static testMethod void test() {
        test.startTest();
        insert new account(Name='test');
        insert new contact(LastName='test');
        insert new task(Subject='test');
        insert new Lead(LastName='test', Company='test');
        massUpdateClass.queueChangeOwnership(UserInfo.getUserId(), UserInfo.getUserId(), true, true, true, true, true);
        test.stopTest();       
    }
    
}