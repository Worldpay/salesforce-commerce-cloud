Feature: ReDirectOrderPlacement
    As a shopper, I want to place an order with ReDirect Payment Method

@ReDirectOrder_AmexCard
Scenario: Registered User is able to place order via Amex Card in Redirect Method
    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|wp01@yahoo.com|Sapient@123|
	    Then Shopper searches for "Shirt"
		Then Selects size "15L"
		Then User add the product to cart and click to Checkout
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65 | 		
		And Select Redierct Mode on payment Page
        And User fills email and phone number and click on Add Payment Button
			|email|password|
			|nsat@yahoo.com|(33) 1 43 12 48 65|
        Then Select Amex card form Prefeered card option "American Express"
        Then User Click on Next Place Order Button 
		Then Click on Place Order and print Order Number
	    Then User add a new Amex card details on Redirected WorldPay Page
			|Card Number |Expiration Month|Expiration Year|Security Code|
			|34343434343434|02|2022|2345|
        Then User click on Make Payment Button